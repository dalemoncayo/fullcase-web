---
name: update-review-checklist
description: Add missed review patterns or newly discovered pitfalls to bad-review.md. Triggered by "add review checklist item", "add to review checklist".
---

If no arguments are provided, ask the user for the following information:

1. **Language / Framework**: TypeScript / React / Next.js / Firebase / Tailwind / shadcn
2. **Category**: Common mistake category (e.g., error handling, type safety, Firestore data model, auth flow)
3. **Summary**: One-line summary of the mistake
4. **Details**: Description of the mistake and why it is a problem
5. **Code example** (optional): NG/OK examples if applicable

## Procedure

1. Read `.claude/skills/code-review/examples/bad-review.md`

2. Check if a matching category already exists
   - If it exists: add the entry under that category
   - If not: create a new category section and add the entry

3. Add an entry in the following format:
````markdown
   - **<Summary>** (<Language / Framework>)
     - Detail: <Details>
     - Example: (if code example provided)
```<language>
       // NG
       <NG code example>

       // OK
       <OK code example>
```
````

4. Check for duplicates before adding

5. Report completion to the user

## Notes

- Use existing category names for consistency
- Keep entries concise and clear
- Always specify the language / framework (TypeScript / React / Next.js / Firebase / Tailwind / shadcn)
