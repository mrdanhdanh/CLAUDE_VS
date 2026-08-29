---
description: "Mô tả prompt — khi nào dùng slash /{{NAME}}"
name: "{{NAME}}"
agent: "agent"
model: "Claude Sonnet 4.5 (copilot)"
tools: [read, edit, search, execute, todo, agent]
argument-hint: "Mô tả input"
---

# /{{NAME}} — ...

Bạn là ... Thực thi:

**Input:** ${input:task:Mô tả task}

## Steps
1. ...
2. ...
3. ...

> Tham chiếu: ...

---
*Template: .github/harness/templates/prompt.md*
