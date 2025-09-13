import os
from utils import load_csv, pretty_print_timetable
from preprocess import preprocess_feasible_triples
from model_builder import build_model, solve_model

def main():
    data_dir = "data"
    
    # Check if data directory exists
    if not os.path.exists(data_dir):
        print(f"Error: The '{data_dir}' directory was not found. Please ensure your CSV files are inside this directory.")
        return

    # Load data from CSV files
    try:
        courses = load_csv(os.path.join(data_dir, "courses.csv"))
        teachers = load_csv(os.path.join(data_dir, "teachers.csv"))
        rooms = load_csv(os.path.join(data_dir, "rooms.csv"))
        groups = load_csv(os.path.join(data_dir, "groups.csv"))
        slots = load_csv(os.path.join(data_dir, "slots.csv"))
    except FileNotFoundError as e:
        print(f"Error: Required file not found - {e.filename}")
        return

    sessions, feasible_triples, processed_teachers = preprocess_feasible_triples(
        courses, teachers, rooms, groups, slots
    )
    
    if not sessions or not feasible_triples:
        print("❌ Preprocessing failed: No feasible triples found. Please check your data for conflicts.")
        return

    model, x_vars, sess_meta = build_model(
        sessions, feasible_triples, processed_teachers, rooms, slots, courses
    )

    print("Building model and solving...")
    sol_df = solve_model(model, x_vars, sessions, courses, slots, timeout_seconds=60)
    
    if sol_df is None or sol_df.empty:
        print("❌ No feasible timetable found.")
        return

    print("\n✅ Timetable found!")
    pretty_print_timetable(sol_df, slots)

if __name__ == "__main__":
    main()
