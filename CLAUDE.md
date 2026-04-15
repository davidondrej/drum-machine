## Rules
- Never do a git commit, or push to github, without the user's explicit permission
- make sure to use git fully & frequently
- Never run `npm run build` unless the user explicitly asks for it

## Git Workflow
- Use clear and descriptive commit messages
- make your commits small and focused
- Never force push (unless the user asks you to)

# SQL and Supabase
- always create .sql files for any SQL queries you want the user to run
- put all of the .sql files into /docs folder in that given project
- each file should start with a number to document the order of the operation
- we must have the entire DB schema documented in the /docs folder, in different .sql files
- name the files like "001_create_x_table.sql" or "002_change_rls_policy.sql" or "003_add_foreign_key.sql" etc.

## Codebase Principles
- keep our codebase very modular & well documented
- follow the principle of "separation of concerns"



