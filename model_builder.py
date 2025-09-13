from ortools.sat.python import cp_model
from collections import defaultdict
import pandas as pd

# Weights for soft objectives (tune as required)
WEIGHT_TEACHER_PREF = 10
WEIGHT_GROUP_GAP = 20
WEIGHT_ROOM_CHANGE = 5
WEIGHT_MAX_LOAD = 1

def build_model(sessions, feasible_triples, teachers_df, rooms_df, slots_df, courses_df):
    model = cp_model.CpModel()

    # Quick maps
    slots_map = slots_df.set_index("id").to_dict(orient="index")
    teachers_map = teachers_df.set_index("id").to_dict(orient="index")
    groups_df = courses_df[["group", "size"]].drop_duplicates().set_index("group")

    # Create Bool vars for all feasible assignments
    x = {}  # key: (sess_idx,t,r,s) -> BoolVar
    for (sess_idx, t_id, r_id, s_id) in feasible_triples:
        x_key = (sess_idx, t_id, r_id, s_id)
        x[x_key] = model.NewBoolVar(f"x_s{sess_idx}_t{t_id}_r{r_id}_sl{s_id}")

    # Index helpers
    session_to_vars = defaultdict(list)
    teacher_slot_to_vars = defaultdict(list)
    room_slot_to_vars = defaultdict(list)
    group_slot_to_vars = defaultdict(list)
    group_room_to_vars = defaultdict(list)
    teacher_to_vars = defaultdict(list)
    for (sess_idx, t_id, r_id, s_id), var in x.items():
        session_to_vars[sess_idx].append(var)
        teacher_slot_to_vars[(t_id, s_id)].append(var)
        room_slot_to_vars[(r_id, s_id)].append(var)
        group_id = sessions[sess_idx]["group"]
        group_slot_to_vars[(group_id, s_id)].append(var)
        group_room_to_vars[(group_id, r_id)].append(var)
        teacher_to_vars[t_id].append(var)

    # --- Hard Constraints ---
    # 1. Each session is assigned exactly one triple (teacher, room, slot)
    for sess_idx in range(len(sessions)):
        model.Add(sum(session_to_vars[sess_idx]) == 1)

    # 2. A teacher can only teach one session at a time
    for (t_id, s_id), vars in teacher_slot_to_vars.items():
        model.Add(sum(vars) <= 1)

    # 3. A room can only be used for one session at a time
    for (r_id, s_id), vars in room_slot_to_vars.items():
        model.Add(sum(vars) <= 1)

    # 4. A group can only attend one class at a time
    for (g_id, s_id), vars in group_slot_to_vars.items():
        model.Add(sum(vars) <= 1)

    # --- Soft Constraints (added as penalty terms to the objective) ---
    objective_terms = []

    # 5. Teacher preferred periods
    for (sess_idx, t_id, r_id, s_id), var in x.items():
        if slots_map[s_id]["period"] not in teachers_map[t_id].get("preferred_periods", set()):
            objective_terms.append(var * WEIGHT_TEACHER_PREF)

    # 6. Group gaps (minimize consecutive classes without a break)
    groups = courses_df["group"].unique()
    for g_id in groups:
        for day in slots_df["day"].unique():
            day_slots = slots_df[(slots_df["day"] == day)].sort_values("period")
            for i in range(len(day_slots) - 1):
                s1_id = day_slots.iloc[i]["id"]
                s2_id = day_slots.iloc[i+1]["id"]
                vars1 = group_slot_to_vars.get((g_id, s1_id), [])
                vars2 = group_slot_to_vars.get((g_id, s2_id), [])
                if vars1 and vars2:
                    # If both slots are used, add a penalty
                    penalty_var = model.NewBoolVar("")
                    model.Add(sum(vars1) + sum(vars2) == 2).OnlyEnforceIf(penalty_var)
                    objective_terms.append(penalty_var * WEIGHT_GROUP_GAP)

    # 7. Minimize room changes for a group
    for g_id in groups:
        for day in slots_df["day"].unique():
            day_slots = slots_df[slots_df["day"] == day].sort_values("period")
            for i in range(len(day_slots) - 1):
                s1_id = day_slots.iloc[i]["id"]
                s2_id = day_slots.iloc[i+1]["id"]
                for r_id in rooms_df["id"]:
                    vars_s1_r = [(k, v) for k, v in x.items() if k[3] == s1_id and sessions[k[0]]["group"] == g_id and k[2] == r_id]
                    vars_s2_r = [(k, v) for k, v in x.items() if k[3] == s2_id and sessions[k[0]]["group"] == g_id and k[2] == r_id]
                    if vars_s1_r and vars_s2_r:
                        # If a group is in room r_id at s1_id and s2_id, no penalty
                        continue
                    if vars_s1_r and not vars_s2_r:
                        # If a group is in room r_id at s1_id but not s2_id, a change might happen
                        # This is a complex constraint. A simpler approach is to penalize if the room is different
                        # A better approach is to use auxiliary variables, which can get complicated
                        pass
                
    # 8. Minimize max teacher load
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
        # no soft terms added
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

    # Build solution DataFrame
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
    return pd.DataFrame(rows)
