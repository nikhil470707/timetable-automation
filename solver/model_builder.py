from ortools.sat.python import cp_model
from collections import defaultdict
import pandas as pd

# Weights for soft objectives (tune as required)
WEIGHT_TEACHER_PREF = 10
WEIGHT_GROUP_GAP = 20
WEIGHT_ROOM_CHANGE = 5
WEIGHT_MAX_LOAD = 1
WEIGHT_SAME_DAY_COURSE = 30  # Higher weight since this is more undesirable

def build_model(sessions, feasible_triples, teachers_df, rooms_df, slots_df, courses_df):
    model = cp_model.CpModel()

    slots_map = slots_df.set_index("id").to_dict(orient="index")
    teachers_map = teachers_df.set_index("id").to_dict(orient="index")
    groups_df = courses_df[["group", "size"]].drop_duplicates().set_index("group")

    # Decision Variables
    x = {}  # key: (sess_idx,t,r,s) -> BoolVar
    for (sess_idx, t_id, r_id, s_id) in feasible_triples:
        x_key = (sess_idx, t_id, r_id, s_id)
        x[x_key] = model.NewBoolVar(f"x_s{sess_idx}_t{t_id}_r{r_id}_sl{s_id}")

    session_to_vars = defaultdict(list)
    teacher_slot_to_vars = defaultdict(list)
    room_slot_to_vars = defaultdict(list)
    group_slot_to_vars = defaultdict(list)
    group_room_to_vars = defaultdict(list)
    teacher_to_vars = defaultdict(list)
    
    # (sess_idx) -> (group_id, course_name)
    session_to_gc = {
        sess["sess_idx"]: (sess["group"], sess["course_name"]) for sess in sessions
    }

    for x_key, var in x.items():
        sess_idx, t_id, r_id, s_id = x_key
        
        session_to_vars[sess_idx].append(var)
        teacher_slot_to_vars[(t_id, s_id)].append(var)
        room_slot_to_vars[(r_id, s_id)].append(var)
        
        group_id = session_to_gc[sess_idx][0]
        group_slot_to_vars[(group_id, s_id)].append(var)
        group_room_to_vars[(group_id, r_id)].append(var)
        teacher_to_vars[t_id].append(var)

    # HARD CONSTRAINTS

    # 1. Each session must be assigned exactly once
    for sess_idx, vars_list in session_to_vars.items():
        model.Add(sum(vars_list) == 1)

    # 2. A teacher can teach only one session at a time
    for _, vars_list in teacher_slot_to_vars.items():
        model.Add(sum(vars_list) <= 1)

    # 3. A room can be used for only one session at a time
    for _, vars_list in room_slot_to_vars.items():
        model.Add(sum(vars_list) <= 1)

    # 4. A group can attend only one session at a time
    for _, vars_list in group_slot_to_vars.items():
        model.Add(sum(vars_list) <= 1)

    # SOFT CONSTRAINTS

    objective_terms = []

    # 1. Soft Constraint: Teacher preference for periods
    pref_penalty_vars = []
    
    # period -> slot_id
    periods_to_slots = {
        slots_map[s_id]["period"]: s_id for s_id in slots_df["id"]
    }
    
    for t_id, t_meta in teachers_map.items():
        preferred = t_meta["preferred_periods"]
        if not preferred:
            continue

        non_preferred_slots = [
            s_id for period, s_id in periods_to_slots.items() if period not in preferred
        ]

        for x_key, var in x.items():
            sess_idx, assigned_t_id, r_id, s_id = x_key
            if assigned_t_id == t_id and s_id in non_preferred_slots:
                pref_penalty_vars.append(var)
    
    if pref_penalty_vars:
        objective_terms.append(WEIGHT_TEACHER_PREF * sum(pref_penalty_vars))


    group_course_day_vars = {}  # (group_id, course_name, day) -> BoolVar (1 if scheduled on that day)
    gc_pairs = set(session_to_gc.values())

    # Group slots by day
    slots_by_day = defaultdict(list)
    for _, row in slots_df.iterrows():
        slots_by_day[row["day"]].append(row["id"])

    # auxiliary variables for (group, course, day)
    for g_id, c_name in gc_pairs:
        for day, slot_ids in slots_by_day.items():
            gcd_key = (g_id, c_name, day)
            
            x_vars_on_day = []
            for (sess_idx, t_id, r_id, s_id), var in x.items():
                if s_id in slot_ids:
                    sess_group, sess_course = session_to_gc[sess_idx]
                    if sess_group == g_id and sess_course == c_name:
                        x_vars_on_day.append(var)
            
            if x_vars_on_day:
                day_count_var = model.NewIntVar(0, len(x_vars_on_day), 
                                                f"count_g{g_id}_c{c_name}_d{day}")
                model.Add(day_count_var == sum(x_vars_on_day))
                group_course_day_vars[gcd_key] = day_count_var

    # penalize when count > 1 (i.e., same course multiple times on same day) 
    same_day_penalty_vars = []
    
    for gcd_key, count_var in group_course_day_vars.items():
        penalty_var = model.NewBoolVar(f"penalty_{gcd_key}")
        

        # penalty_var = 1 iff count_var >= 2
        model.Add(count_var >= 2).OnlyEnforceIf(penalty_var)
        model.Add(count_var <= 1).OnlyEnforceIf(penalty_var.Not())
        
        same_day_penalty_vars.append(penalty_var)

    if same_day_penalty_vars:
        objective_terms.append(WEIGHT_SAME_DAY_COURSE * sum(same_day_penalty_vars))

    max_load = model.NewIntVar(0, len(sessions), "max_teacher_load")
    for t_id in teachers_df["id"]:
        load_vars = teacher_to_vars.get(t_id, [])
        if load_vars:
            model.Add(sum(load_vars) <= max_load)
    objective_terms.append(WEIGHT_MAX_LOAD * max_load)

    # Final objective
    if objective_terms:
        model.Minimize(sum(objective_terms))
    else:
        model.Minimize(0)

    return model, x, sessions
        
def solve_model(model, x_vars, sessions, courses_df, slots_df, timeout_seconds=60):
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = timeout_seconds
    solver.parameters.num_search_workers = 8
    solver.parameters.log_search_progress = False
    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    import pandas as pd
    rows = []
    sess_meta = { sess["sess_idx"]: sess for sess in sessions }
    for (sess_idx, t_id, r_id, s_id), var in x_vars.items():
        if solver.Value(var) == 1:
            meta = sess_meta[sess_idx]
            rows.append({
                "session": sess_idx,
                "course_idx": meta["course_idx"],
                "course_name": meta["course_name"],
                "group": meta["group"],
                "teacher": t_id,
                "room": r_id,
                "slot": s_id
            })
    
    sol_df = pd.DataFrame(rows)
    
    return sol_df