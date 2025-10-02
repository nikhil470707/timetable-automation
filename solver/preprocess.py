from collections import defaultdict
import pandas as pd

def _split_strip(s):
    if pd.isna(s):
        return []
    s = str(s).strip()
    if not s:
        return []
    return [x.strip() for x in s.split(",") if x.strip()]

def preprocess_feasible_triples(courses_df, teachers_df, rooms_df, groups_df, slots_df):
    teachers_df["qualified_courses"] = teachers_df["qualified_courses"].apply(
        lambda s: set(_split_strip(s))
    )
    teachers_df["available_days"] = teachers_df["available_days"].apply(
        lambda s: set(_split_strip(s))
    )
    teachers_df["preferred_periods"] = teachers_df["preferred_periods"].apply(
        lambda s: set([int(x) for x in _split_strip(s)])
    )

    courses = courses_df.reset_index(drop=True).copy()
    teachers = teachers_df.copy()
    rooms = rooms_df.copy()
    slots = slots_df.copy()
    
    tmap = teachers.set_index("id").to_dict(orient="index")

    # sessions (one entry per required hour)
    sessions = []
    s_idx = 0
    for c_idx, crow in courses.iterrows():
        hours = int(crow["hours"])
        for i in range(hours):
            sessions.append({
                "sess_idx": s_idx,
                "course_idx": int(c_idx),
                "course_name": crow["course"],
                "group": crow["group"],
                "size": int(crow["size"])
            })
            s_idx += 1

    # feasible triples (session, teacher, room, slot)
    feasible_triples = []
    rooms_list = list(rooms["id"])
    slots_list = list(slots["id"])
    slots_info = slots.set_index("id").to_dict(orient="index")

    for sess in sessions:
        c_name = sess["course_name"]
        g_size = sess["size"]
        for trow in teachers.itertuples(index=False):
            t_id = getattr(trow, "id")
            qset = tmap[t_id]["qualified_courses"]
            if len(qset) > 0 and c_name not in qset:
                continue
            
            for r_id in rooms_list:
                r_capacity_match = rooms.loc[rooms["id"] == r_id, "capacity"].values
                if len(r_capacity_match) == 0:
                     continue
                rcap = int(r_capacity_match[0]) 
                
                if rcap < g_size:
                    continue
                
                for s_id in slots_list:
                    s_day = slots_info[s_id]["day"]
                    avail_days = tmap[t_id]["available_days"]
                    if len(avail_days) > 0 and s_day not in avail_days:
                        continue
                    
                    feasible_triples.append((sess["sess_idx"], t_id, r_id, s_id))
    
    return sessions, feasible_triples, teachers
