# Evaluating AI Models: Code, Human, and Model-Based Grading

In this notebook, we'll delve into a trio of widely-used techniques for assessing the effectiveness of AI models, like Claude v3:

1. Code-based grading
2. Human grading
3. Model-based grading

We'll illustrate each approach through examples and examine their respective advantages and limitations, when gauging AI performance.

## Code-Based Grading Example: Sentiment Analysis

In this example, we'll evaluate Claude's ability to classify the sentiment of movie reviews as positive or negative. We can use code to check if the model's output matches the expected sentiment.

```python
# Store the model name and AWS region for later use
MODEL_NAME = "anthropic.claude-3-haiku-20240307-v1:0"
AWS_REGION = "us-west-2"

%store MODEL_NAME
%store AWS_REGION
```

```python
# Install the Anthropic package
%pip install anthropic --quiet
```

```python
# Import the AnthropicBedrock class and create a client instance
from anthropic import AnthropicBedrock

client = AnthropicBedrock(aws_region=AWS_REGION)
```

```python
# Function to build the input prompt for sentiment analysis
def build_input_prompt(review):
    user_content = f"""Classify the sentiment of the following movie review as either 'positive' or 'negative' provide only one of those two choices:
    <review>{review}</review>"""
    return [{"role": "user", "content": user_content}]

# Define the evaluation data
eval = [
    {
        "review": "This movie was amazing! The acting was superb and the plot kept me engaged from start to finish.",
        "golden_answer": "positive"
    },
    {
        "review": "I was thoroughly disappointed by this film. The pacing was slow and the characters were one-dimensional.",
        "golden_answer": "negative"
    }
]

# Function to get completions from the model
def get_completion(messages):
    message = client.messages.create(
        model=MODEL_NAME,
        max_tokens=2000,
        temperature=0.0,
        messages=messages
    )
    return message.content[0].text

# Get completions for each input
outputs = [get_completion(build_input_prompt(item["review"])) for item in eval]

# Print the outputs and golden answers
for output, question in zip(outputs, eval):
    print(f"Review: {question['review']}\nGolden Answer: {question['golden_answer']}\nOutput: {output}\n")

# Function to grade the completions
def grade_completion(output, golden_answer):
    return output.lower() == golden_answer.lower()

# Grade the completions and print the accuracy
grades = [grade_completion(output, item["golden_answer"]) for output, item in zip(outputs, eval)]
print(f"Accuracy: {sum(grades) / len(grades) * 100}%")
```

## Human Grading Example: Essay Scoring

Some tasks, like scoring essays, are difficult to evaluate with code alone. In this case, we can provide guidelines for human graders to assess the model's output.

```python
# Function to build the input prompt for essay generation
def build_input_prompt(topic):
    user_content = f"""Write a short essay discussing the following topic:
    <topic>{topic}</topic>"""
    return [{"role": "user", "content": user_content}]

# Define the evaluation data
eval = [
    {
        "topic": "The importance of education in personal development and societal progress",
        "golden_answer": "A high-scoring essay should have a clear thesis, well-structured paragraphs, and persuasive examples discussing how education contributes to individual growth and broader societal advancement."
    }
]

# Get completions for each input
outputs = [get_completion(build_input_prompt(item["topic"])) for item in eval]

# Print the outputs and golden answers
for output, item in zip(outputs, eval):
    print(f"Topic: {item['topic']}\n\nGrading Rubric:\n {item['golden_answer']}\n\nModel Output:\n{output}\n")
```

## Model-Based Grading Examples

We can use Claude to grade its own outputs by providing the model's response and a grading rubric. This allows us to automate the evaluation of tasks that would typically require human judgment.

### Example 1: Summarization

In this example, we'll use Claude to assess the quality of a summary it generated. This can be useful when you need to evaluate the model's ability to capture key information from a longer text concisely and accurately. By providing a rubric that outlines the essential points that should be covered, we can automate the grading process and quickly assess the model's performance on summarization tasks.

```python
# Function to build the input prompt for summarization
def build_input_prompt(text):
    user_content = f"""Please summarize the main points of the following text:
    <text>{text}</text>"""
    return [{"role": "user", "content": user_content}]

# Function to build the grader prompt for assessing summary quality
def build_grader_prompt(output, rubric):
    user_content = f"""Assess the quality of the following summary based on this rubric:
    <rubric>{rubric}</rubric>
    <summary>{output}</summary>
    Provide a score from 1-5, where 1 is poor and 5 is excellent."""
    return [{"role": "user", "content": user_content}]

# Define the evaluation data
eval = [
    {
        "text": "The Magna Carta, signed in 1215, was a pivotal document in English history. It limited the powers of the monarchy and established the principle that everyone, including the king, was subject to the law. This laid the foundation for constitutional governance and the rule of law in England and influenced legal systems worldwide.",
        "golden_answer": "A high-quality summary should concisely capture the key points: 1) The Magna Carta's significance in English history, 2) Its role in limiting monarchical power, 3) Establishing the principle of rule of law, and 4) Its influence on legal systems around the world."
    }
]

# Get completions for each input
outputs = [get_completion(build_input_prompt(item["text"])) for item in eval]

# Grade the completions
grades = [get_completion(build_grader_prompt(output, item["golden_answer"])) for output, item in zip(outputs, eval)]

# Print the summary quality score
print(f"Summary quality score: {grades[0]}")
```

### Example 2: Fact-Checking

In this example, we'll use Claude to fact-check a claim and then assess the accuracy of its fact-checking. This can be useful when you need to evaluate the model's ability to distinguish between accurate and inaccurate information. By providing a rubric that outlines the key points that should be covered in a correct fact-check, we can automate the grading process and quickly assess the model's performance on fact-checking tasks.

```python
# Function to build the input prompt for fact-checking
def build_input_prompt(claim):
    user_content = f"""Determine if the following claim is true or false:
    <claim>{claim}</claim>"""
    return [{"role": "user", "content": user_content}]

# Function to build the grader prompt for assessing fact-check accuracy
def build_grader_prompt(output, rubric):
    user_content = f"""Based on the following rubric, assess whether the fact-check is correct:
    <rubric>{rubric}</rubric>
    <fact-check>{output}</fact-check>"""
    return [{"role": "user", "content": user_content}]

# Define the evaluation data
eval = [
    {
        "claim": "The Great Wall of China is visible from space.",
        "golden_answer": "A correct fact-check should state that this claim is false. While the Great Wall is an impressive structure, it is not visible from space with the naked eye."
    }
]

# Get completions for each input
outputs = [get_completion(build_input_prompt(item["claim"])) for item in eval]

grades = []
for output, item in zip(outputs, eval):
    # Print the claim, fact-check, and rubric
    print(f"Claim: {item['claim']}\n")
    print(f"Fact-check: {output}]\n")
    print(f"Rubric: {item['golden_answer']}\n")

    # Grade the fact-check
    grader_prompt = build_grader_prompt(output, item["golden_answer"])
    grade = get_completion(grader_prompt)
    grades.append("correct" in grade.lower())

# Print the fact-checking accuracy
accuracy = sum(grades) / len(grades)
print(f"Fact-checking accuracy: {accuracy * 100}%")
```

### Example 3: Tone Analysis

In this example, we'll use Claude to analyze the tone of a given text and then assess the accuracy of its analysis. This can be useful when you need to evaluate the model's ability to identify and interpret the emotional content and attitudes expressed in a piece of text. By providing a rubric that outlines the key aspects of tone that should be identified, we can automate the grading process and quickly assess the model's performance on tone analysis tasks.

```python
# Function to build the input prompt for tone analysis
def build_input_prompt(text):
    user_content = f"""Analyze the tone of the following text:
    <text>{text}</text>"""
    return [{"role": "user", "content": user_content}]

# Function to build the grader prompt for assessing tone analysis accuracy
def build_grader_prompt(output, rubric):
    user_content = f"""Assess the accuracy of the following tone analysis based on this rubric:
    <rubric>{rubric}</rubric>
    <tone-analysis>{output}</tone-analysis>"""
    return [{"role": "user", "content": user_content}]

# Define the evaluation data
eval = [
    {
        "text": "I can't believe they canceled the event at the last minute. This is completely unacceptable and unprofessional!",
        "golden_answer": "The tone analysis should identify the text as expressing frustration, anger, and disappointment. Key words like 'can't believe', 'last minute', 'unacceptable', and 'unprofessional' indicate strong negative emotions."
    }
]

# Get completions for each input
outputs = [get_completion(build_input_prompt(item["text"])) for item in eval]

# Grade the completions
grades = [get_completion(build_grader_prompt(output, item["golden_answer"])) for output, item in zip(outputs, eval)]

# Print the tone analysis quality
print(f"Tone analysis quality: {grades[0]}")
```

These examples demonstrate how code-based, human, and model-based grading can be used to evaluate AI models like Claude on various tasks. The choice of evaluation method depends on the nature of the task and the resources available. Model-based grading offers a promising approach for automating the assessment of complex tasks that would otherwise require human judgment.