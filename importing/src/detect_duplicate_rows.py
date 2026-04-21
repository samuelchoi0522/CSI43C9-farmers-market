import pandas as pd

# Load the CSV file
df = pd.read_csv("Clean_Transactions(For_Import).csv")

# Find duplicate rows (based on all columns)
duplicates = df[df.duplicated()]

# Print duplicates
if duplicates.empty:
    print("No duplicate rows found.")
else:
    print("Duplicate rows:")
    print(duplicates)

# Optional: save duplicates to a file
duplicates.to_csv("duplicates_found.csv", index=False)