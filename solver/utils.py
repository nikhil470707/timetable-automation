import pandas as pd
import os

def load_csv(path):
    df = pd.read_csv(path, encoding="utf-8-sig")
    df.columns = df.columns.str.strip()
    return df

def pretty_print_timetable(df, slots_df):
    # df columns: session, course_idx, course_name, group, teacher, room, slot
    if df.empty:
        print("No solution.")
        return
    slots_map = slots_df.set_index("id").to_dict(orient="index")
    # group by group and day
    df_out = df.copy()
    df_out["day"] = df_out["slot"].map(lambda s: slots_map[s]["day"])
    df_out["period"] = df_out["slot"].map(lambda s: slots_map[s]["period"])
    df_out = df_out.sort_values(["group", "day", "period"])
    for g, sub in df_out.groupby("group"):
        print(f"\n--- Group {g} ---")
        for _, r in sub.iterrows():
            print(f"{r['day']}-P{r['period']}: {r['course_name']} ({r['teacher']}, {r['room']})")
