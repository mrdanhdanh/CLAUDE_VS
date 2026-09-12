# Chapter 2: Being Clear and Direct

- [Lesson](#lesson)
- [Exercises](#exercises)
- [Example Playground](#example-playground)

## Setup

Run the following setup cell to load your API key and establish the `get_completion` helper function.

```python
# Import python's built-in regular expression library
import re
import boto3
import json

# Import the hints module from the utils package
import os
import sys
module_path = ".."
sys.path.append(os.path.abspath(module_path))
from utils import hints

# Retrieve the MODEL_NAME variable from the IPython store
%store -r MODEL_NAME
%store -r AWS_REGION

client = boto3.client('bedrock-runtime',region_name=AWS_REGION)

def get_completion(prompt,system=''):
    body = json.dumps(
        {
            "anthropic_version": '',
            "max_tokens": 2000,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "top_p": 1,
            "system": system
        }
    )
    response = client.invoke_model(body=body, modelId=MODEL_NAME)
    response_body = json.loads(response.get('body').read())

    return response_body.get('content')[0].get('text')
```

---

## Lesson

**Claude responds best to clear and direct instructions.**

Think of Claude like any other human that is new to the job. **Claude has no context** on what to do aside from what you literally tell it. Just as when you instruct a human for the first time on a task, the more you explain exactly what you want in a straightforward manner to Claude, the better and more accurate Claude's response will be."				
				
When in doubt, follow the **Golden Rule of Clear Prompting**:
- Show your prompt to a colleague or friend and have them follow the instructions themselves to see if they can produce the result you want. If they're confused, Claude's confused.

### Examples

Let's take a task like writing poetry. (Ignore any syllable mismatch - LLMs aren't great at counting syllables yet.)

```python
# Prompt
PROMPT = "Write a haiku about robots."

# Print Claude's response
print(get_completion(PROMPT))
```

This haiku is nice enough, but users may want Claude to go directly into the poem without the "Here is a haiku" preamble.

How do we achieve that? We **ask for it**!

```python
# Prompt
PROMPT = "Write a haiku about robots. Skip the preamble; go straight into the poem."

# Print Claude's response
print(get_completion(PROMPT))
```

Here's another example. Let's ask Claude who's the best basketball player of all time. You can see below that while Claude lists a few names, **it doesn't respond with a definitive "best"**.

```python
# Prompt
PROMPT = "Who is the best basketball player of all time?"

# Print Claude's response
print(get_completion(PROMPT))
```

Can we get Claude to make up its mind and decide on a best player? Yes! Just ask!

```python
# Prompt
PROMPT = "Who is the best basketball player of all time? Yes, there are differing opinions, but if you absolutely had to pick one player, who would it be?"

# Print Claude's response
print(get_completion(PROMPT))
```

If you would like to experiment with the lesson prompts without changing any content above, scroll all the way to the bottom of the lesson notebook to visit the [**Example Playground**](#example-playground).

---

## Exercises
- [Exercise 2.1 - Spanish](#exercise-21---spanish)
- [Exercise 2.2 - One Player Only](#exercise-22---one-player-only)
- [Exercise 2.3 - Write a Story](#exercise-23---write-a-story)

### Exercise 2.1 - Spanish
Modify the `SYSTEM_PROMPT` to make Claude output its answer in Spanish.

```python
# System prompt - this is the only field you should chnage
SYSTEM_PROMPT = "[Replace this text]"

# Prompt
PROMPT = "Hello Claude, how are you?"

# Get Claude's response
response = get_completion(PROMPT, SYSTEM_PROMPT)

# Function to grade exercise correctness
def grade_exercise(text):
    return "hola" in text.lower()

# Print Claude's response and the corresponding grade
print(response)
print("\n--------------------------- GRADING ---------------------------")
print("This exercise has been correctly solved:", grade_exercise(response))
```

❓ If you want a hint, run the cell below!

```python
print(hints.exercise_2_1_hint)
```

### Exercise 2.2 - One Player Only

Modify the `PROMPT` so that Claude doesn't equivocate at all and responds with **ONLY** the name of one specific player, with **no other words or punctuation**.

```python
# Prompt - this is the only field you should change
PROMPT = "[Replace this text]"

# Get Claude's response
response = get_completion(PROMPT)

# Function to grade exercise correctness
def grade_exercise(text):
    return text == "Michael Jordan"

# Print Claude's response and the corresponding grade
print(response)
print("\n--------------------------- GRADING ---------------------------")
print("This exercise has been correctly solved:", grade_exercise(response))
```

❓ If you want a hint, run the cell below!

```python
print(hints.exercise_2_2_hint)
```

### Exercise 2.3 - Write a Story

Modify the `PROMPT` so that Claude responds with as long a response as you can muster. If your answer is **over 800 words**, Claude's response will be graded as correct.

```python
# Prompt - this is the only field you should change
PROMPT = "[Replace this text]"

# Get Claude's response
response = get_completion(PROMPT)

# Function to grade exercise correctness
def grade_exercise(text):
    trimmed = text.strip()
    words = len(trimmed.split())
    return words >= 800

# Print Claude's response and the corresponding grade
print(response)
print("\n--------------------------- GRADING ---------------------------")
print("This exercise has been correctly solved:", grade_exercise(response))
```

❓ If you want a hint, run the cell below!

```python
print(hints.exercise_2_3_hint)
```

### Congrats!

If you've solved all exercises up until this point, you're ready to move to the next chapter. Happy prompting!

---

## Example Playground

This is an area for you to experiment freely with the prompt examples shown in this lesson and tweak prompts to see how it may affect Claude's responses.

```python
# Prompt
PROMPT = "Write a haiku about robots."

# Print Claude's response
print(get_completion(PROMPT))
```

```python
# Prompt
PROMPT = "Write a haiku about robots. Skip the preamble; go straight into the poem."

# Print Claude's response
print(get_completion(PROMPT))
```

```python
# Prompt
PROMPT = "Who is the best basketball player of all time?"

# Print Claude's response
print(get_completion(PROMPT))
```

```python
# Prompt
PROMPT = "Who is the best basketball player of all time? Yes, there are differing opinions, but if you absolutely had to pick one player, who would it be?"

# Print Claude's response
print(get_completion(PROMPT))
```