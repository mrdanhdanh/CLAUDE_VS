# Tutorial How-To

This tutorial requires this initial notebook to be run first so that the requirements and environment variables are stored for all notebooks in the workshop.

## How to get started

1. Clone this repository to your local machine.

2. Install the required dependencies by running the following command:

> ⚠️ **Please ignore error messages related to pip's dependency resolver.**

```python
%pip install -qU pip
%pip install -qr ../requirements.txt
```

3. Restart the kernel after installing dependencies

```python
# restart kernel
from IPython.core.display import HTML
HTML("<script>Jupyter.notebook.kernel.restart()</script>")
```

4. Run the notebook cells in order, following the instructions provided.

---

## Usage Notes & Tips 💡

- This course uses Claude 3 Haiku with temperature 0. We will talk more about temperature later in the course. For now, it's enough to understand that these settings yield more deterministic results. All prompt engineering techniques in this course also apply to previous generation legacy Claude models such as Claude 2 and Claude Instant 1.2.

- You can use `Shift + Enter` to execute the cell and move to the next one.

- When you reach the bottom of a tutorial page, navigate to the next numbered file in the folder, or to the next numbered folder if you're finished with the content within that chapter file.

### The Anthropic SDK & the Messages API
We will be using the [Anthropic python SDK](https://docs.anthropic.com/claude/reference/client-sdks) and the [Messages API](https://docs.anthropic.com/claude/reference/messages_post) throughout this tutorial. 

Below is an example of what running a prompt will look like in this tutorial. First, we create `get_completion`, which is a helper function that sends a prompt to Claude and returns Claude's generated response. Run that cell now.

First, we set and store the model name and region.

```python
import boto3
session = boto3.Session() # create a boto3 session to dynamically get and set the region name
AWS_REGION = session.region_name
print("AWS Region:", AWS_REGION)
MODEL_NAME = "anthropic.claude-3-haiku-20240307-v1:0"

%store MODEL_NAME
%store AWS_REGION
```

Then, we create `get_completion`, which is a helper function that sends a prompt to Claude and returns Claude's generated response. Run that cell now.

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime',region_name=AWS_REGION)

def get_completion(prompt):
    body = json.dumps(
        {
            "anthropic_version": '',
            "max_tokens": 2000,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "top_p": 1,
            "system": ''
        }
    )
    response = bedrock.invoke_model(body=body, modelId=MODEL_NAME)
    response_body = json.loads(response.get('body').read())

    return response_body.get('content')[0].get('text')
```

Now we will write out an example prompt for Claude and print Claude's output by running our `get_completion` helper function. Running the cell below will print out a response from Claude beneath it.

Feel free to play around with the prompt string to elicit different responses from Claude.

```python
# Prompt
prompt = "Hello, Claude!"

# Get Claude's response
print(get_completion(prompt))
```

The `MODEL_NAME` and `AWS_REGION` variables defined earlier will be used throughout the tutorial. Just make sure to run the cells for each tutorial page from top to bottom.