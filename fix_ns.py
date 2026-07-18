with open("generate_deep_scenarios.py", "r") as f:
    c = f.read()
c = c.replace(",'t':0)", ", 0)").replace(",'t':1)", ", 1)").replace(",'t':2)", ", 2)").replace(",'t':3)", ", 3)").replace(",'t':4)", ", 4)").replace(",'t':5)", ", 5)").replace(",'t':6)", ", 6)")
with open("generate_deep_scenarios.py", "w") as f:
    f.write(c)
print("Fixed north_star tuple syntax")