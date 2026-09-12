# Lesson 4: Call transcript summarizer

In this lesson, we're going to write a complex prompt for a common customer use-case: summarizing.  Specifically, we'll summarize long customer service call transcripts.  Our goal is to summarize customer service calls for customer support metrics.  We want summaries of complete customer service calls to evaluate the efficacy of our customer support team.  This means we'll exclude calls that have connection issues, language barriers, and other issues that hinder effective summarization.

Let's imagine we work for Acme Corporation, a company that sells smart home devices. The company handles hundreds of customer service calls daily and needs a way to quickly turn these conversations into **useful, structured data**. 

Some important considerations include:
* Calls can be short and sweet or long and complicated.
* Customers might be calling about anything from a simple Wi-Fi connection issue to a complex system malfunction.
* We need our summaries in a specific format so they're easy to analyze later.
* We have to be careful not to include any personal customer information in our summaries.

To help us out, we'll follow the best practices we described previously:
* Use a system prompt to set the stage.
* Structure the prompt for optimal performance.
* Give clear instructions and define your desired output.
* Use XML tags to organize information.
* Handle special cases and edge scenarios.
* Provide examples to guide the model.

---

## Understanding the data

Now that we understand our task, let's take a look at the data we'll be working with. In this lesson, we'll use a variety of simulated customer service call transcripts from Acme Corporation's smart home device support team. These transcripts will help us create a robust prompt that can handle different scenarios.

Let's examine some of the types of call transcripts we might encounter:

A short and simple transcript:

```python
call1 = """
Agent: Thank you for calling Acme Smart Home Support. This is Alex. How can I help you?
Customer: Hi, I can't turn on my smart light bulb.
Agent: I see. Have you tried resetting the bulb?
Customer: Oh, no. How do I do that?
Agent: Just turn the power off for 5 seconds, then back on. It should reset.
Customer: Ok, I'll try that. Thanks!
Agent: You're welcome. Call us back if you need further assistance.
"""
```

A medium-length transcript with an eventual resolution:

```python
call2 = """
Agent: Acme Smart Home Support, this is Jamie. How may I assist you today?
Customer: Hi Jamie, my Acme SmartTherm isn't maintaining the temperature I set. It's set to 72 but the house is much warmer.
Agent: I'm sorry to hear that. Let's troubleshoot. Is your SmartTherm connected to Wi-Fi?
Customer: Yes, the Wi-Fi symbol is showing on the display.
Agent: Great. Let's recalibrate your SmartTherm. Press and hold the menu button for 5 seconds.
Customer: Okay, done. A new menu came up.
Agent: Perfect. Navigate to "Calibration" and press select. Adjust the temperature to match your room thermometer.
Customer: Alright, I've set it to 79 degrees to match.
Agent: Great. Press select to confirm. It will recalibrate, which may take a few minutes. Check back in an hour to see if it's fixed.
Customer: Okay, I'll do that. Thank you for your help, Jamie.
Agent: You're welcome! Is there anything else I can assist you with today?
Customer: No, that's all. Thanks again.
Agent: Thank you for choosing Acme Smart Home. Have a great day!
"""
```

A longer call with no resolution:

```python
call3 = """
Agent: Thank you for contacting Acme Smart Home Support. This is Sarah. How can I help you today?
Customer: Hi Sarah, I'm having trouble with my Acme SecureHome system. The alarm keeps going off randomly.
Agent: I'm sorry to hear that. Can you tell me when this started happening?
Customer: It started about two days ago. It's gone off three times now, always in the middle of the night.
Agent: I see. Are there any error messages on the control panel when this happens?
Customer: No, I didn't notice any. But I was pretty groggy each time.
Agent: Understood. Let's check a few things. First, can you confirm that all your doors and windows are closing properly?
Customer: Yes, I've checked all of them. They're fine.
Agent: Okay. Next, let's check the battery in your control panel. Can you tell me if the low battery indicator is on?
Customer: Give me a moment... No, the battery indicator looks normal.
Agent: Alright. It's possible that one of your sensors is malfunctioning. I'd like to run a diagnostic, but I'll need to transfer you to our technical team for that. Is that okay?
Customer: Yes, that's fine. I just want this fixed. It's really disruptive.
Agent: I completely understand. I'm going to transfer you now. They'll be able to run a full system diagnostic and hopefully resolve the issue for you.
Customer: Okay, thank you.
Agent: You're welcome. Thank you for your patience, and I hope you have a great rest of your day.
"""
```

These examples showcase the variety of calls and considerations we need to handle:
* Calls have wildly different lengths.
* Calls feature various support issues (simple fixes, device malfunctions, complex problems).
* Some calls end with a resolution and others remain unresolved cases.
* Some calls require follow-up.

As we build our prompt, we'll need to ensure it can effectively summarize all these types of calls, extracting the key information and presenting it in a consistent, structured format.
In the next section, we'll start building our prompt, step by step, to handle this diverse range of call transcripts. 

---

## A simple version of the prompt
Now that we understand our task and the kind of data we're working with, let's start building our prompt. We'll begin with a basic version and gradually refine it to handle the complexities of our call summarization task.

Let's begin with this very simple prompt that outlines the basic task:

```python
prompt = """
Summarize the following customer service call transcript. Focus on the main issue, how it was resolved, and any required follow-up.

{transcript}
"""
```

This basic prompt gives Claude a general idea of what we want, but it has several limitations:

* It doesn't specify the desired output format, which could lead to inconsistent summaries.
* It doesn't provide guidance on how to handle different scenarios (like unresolved issues or insufficient information).
* It doesn't set any constraints on length or content, potentially resulting in overly long or detailed summaries.
* It doesn't instruct Claude to omit personal information, which could lead to privacy issues.

With that said, let's test it out to get a sense of how it performs:

```python
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()
client = Anthropic()

def summarize_call(transcript):
    final_prompt = prompt.format(transcript=transcript)
    # Make the API call
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4096,
        messages=[
            {"role": "user", "content": final_prompt}
        ]
    )
    print(response.content[0].text)
```

```python
summarize_call(call1)
```

```python
summarize_call(call2)
```

```python
summarize_call(call3)
```

As you can see, while Claude does provide a summary, it's not in a format that would be easy to analyze systematically. The summary might be too long or too short, and it might not consistently cover all the points we're interested in.


In the next steps, we'll start adding more structure and guidance to our prompt to address these limitations. We'll see how each addition improves the quality and consistency of Claude's summaries.

Remember, prompt engineering is an iterative process. We start simple and gradually refine our prompt.

---

## Adding a system prompt

The easiest place to start is with a system prompt that sets the overall context and role for Claude, helping to guide its behavior throughout the interaction.

Let's start with this system prompt:

```python
system = """
You are an expert customer service analyst, skilled at extracting key information from call transcripts and summarizing them in a structured format.
Your task is to analyze customer service call transcripts and generate concise, accurate summaries while maintaining a professional tone.
"""
```

--- 

## Structuring our main prompt

Next, we're going to start writing the main prompt.  We'll rely on some of these prompting tips:

- Put long documents (our transcripts) at the top.
- Add detailed instructions and output format requirements.
- Introduce XML tags for structuring the prompt and output.
- Give Claude space "to think out loud". 

Because this prompt may get quite long, we'll write individual pieces in isolation and then combine them together.

### The input data
When working with large language models like Claude, it's crucial to put long documents, like our call transcripts, at the beginning of the prompt. This ensures that Claude has all the necessary context before receiving specific instructions. We should also use XML tags to identify the transcript in the prompt:

```python
prompt_pt1 = """
Analyze the following customer service call transcript and generate a JSON summary of the interaction:

<transcript>
[INSERT CALL TRANSCRIPT HERE]
</transcript>
"""
```

### Instructions and output format

Before we go any further, let's think clearly about what a good structured output format might look like.  To make our life easier when parsing the results, it's often easiest to ask Claude for a JSON response.  What should a good JSON look like in this case?

At a minimum, our JSON output should include the following:
- A status as to whether Claude had enough information to generate a summary.  We'll come back to this.  For now, we'll assume that all summaries have a status of "COMPLETE" meaning that Claude could generate a summary.
- A summary of the customer issue
- If the call requires additional follow up
- Details on any follow up actions, if required (call the customer back, etc.)
- How the issue was resolved
- A list of ambiguities or vague points in the conversation

Here's a proposed sample JSON structure:

```json
{
  "summary": {
    "customerIssue": "Brief description of the main problem or reason for the call",
    "resolution": "How the issue was addressed or resolved, if applicable",
    "followUpRequired": true/false,
    "followUpDetails": "Description of any necessary follow-up actions, or null if none required"
  },
  "status": "COMPLETE",
  "ambiguities": ["List of any unclear or vague points in the conversation, or an empty array if none"]
}
```

Let's create a new piece of our prompt that includes specific instructions, including:
- Create a summary focusing on the main issue, resolution, and any follow-up actions required.
- Generate a JSON output following our specific, standardized format.
- Omit specific customer information in the summaries.
- Keep each piece of the summary short.

Here's an attempt at providing the output instructions, including our specific output JSON format:

```python
prompt_pt2 = """
Instructions:
1. Read the transcript carefully.
2. Analyze the transcript, focusing on the main issue, resolution, and any follow-up required.
3. Generate a JSON object summarizing the key aspects of the interaction according to the specified structure.

Important guidelines:
- Confidentiality: Omit all specific customer data like names, phone numbers, and email addresses.
- Character limit: Restrict each text field to a maximum of 100 characters.
- Maintain a professional tone in your summary.

Output format:
Generate a JSON object with the following structure:
<json>
{
  "summary": {
    "customerIssue": "Brief description of the main problem or reason for the call",
    "resolution": "How the issue was addressed or resolved, if applicable",
    "followUpRequired": true/false,
    "followUpDetails": "Description of any necessary follow-up actions, or null if none required"
  },
  "status": "COMPLETE",
  "ambiguities": ["List of any unclear or vague points in the conversation, or an empty array if none"]
}
</json>
"""
```

--- 

## Using XML tags and giving Claude room to think
Next, we'll employ two more prompting strategies: giving Claude room to think and using XML tags.
- We'll ask Claude to start by outputting `<thinking>` tags that contain its analysis.
- Then, we'll ask Claude to output its JSON output inside of `<json>`.

Here's the final piece of our first draft prompt:

```python
prompt_pt3 = """
Before generating the JSON, please analyze the transcript in <thinking> tags.
Include your identification of the main issue, resolution, follow-up requirements, and any ambiguities.
Then, provide your JSON output in <json> tags.
"""
```

By asking Claude to put its analysis within `<thinking>` tags, we're prompting it to break down its thought process before formulating the final JSON output. This encourages a more thorough and structured approach to analyzing the transcript.
The `<thinking>` section allows us (and potentially other reviewers or systems) to see Claude's reasoning process. This transparency can be crucial for debugging and quality assurance purposes.


By separating the analysis (`<thinking`>) from the structured output (`<json>`), we create a clear distinction between Claude's interpretation of the transcript and its formatted summary. This can be helpful in cases where we might want to review the analysis separately from the JSON output, but also by isolating the JSON content inside of `<json>` tags, we make it easy to parse the final response and capture the JSON we want to work with.

--- 

## Testing our updated prompt

Here's the complete version of the prompt, constructed by combining the individual prompt pieces we've written so far:

```python
system = """
You are an expert customer service analyst, skilled at extracting key information from call transcripts and summarizing them in a structured format.
Your task is to analyze customer service call transcripts and generate concise, accurate summaries while maintaining a professional tone.
"""

prompt = """
Analyze the following customer service call transcript and generate a JSON summary of the interaction:

<transcript>
[INSERT CALL TRANSCRIPT HERE]
</transcript>

Instructions:
1. Read the transcript carefully.
2. Analyze the transcript, focusing on the main issue, resolution, and any follow-up required.
3. Generate a JSON object summarizing the key aspects of the interaction according to the specified structure.

Important guidelines:
- Confidentiality: Omit all specific customer data like names, phone numbers, and email addresses.
- Character limit: Restrict each text field to a maximum of 100 characters.
- Maintain a professional tone in your summary.

Output format:
Generate a JSON object with the following structure:
<json>
{
  "summary": {
    "customerIssue": "Brief description of the main problem or reason for the call",
    "resolution": "How the issue was addressed or resolved, if applicable",
    "followUpRequired": true/false,
    "followUpDetails": "Description of any necessary follow-up actions, or null if none required"
  },
  "status": "COMPLETE",
  "ambiguities": ["List of any unclear or vague points in the conversation, or an empty array if none"]
}
</json>

Before generating the JSON, please analyze the transcript in <thinking> tags.
Include your identification of the main issue, resolution, follow-up requirements, and any ambiguities.
Then, provide your JSON output in <json> tags.
"""
```

Here's a function we can use to test our prompt:

```python
def summarize_call_with_improved_prompt(transcript):
    final_prompt = prompt.replace("[INSERT CALL TRANSCRIPT HERE]", transcript)
    # Make the API call
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        system=system,
        max_tokens=4096,
        messages=[
            {"role": "user", "content": final_prompt}
        ]
    )
    print(response.content[0].text)
```

Let's test out the prompt using some of the call transcripts we previously defined:

```python
summarize_call_with_improved_prompt(call1)
```

```python
summarize_call_with_improved_prompt(call2)
```

```python
summarize_call_with_improved_prompt(call3)
```

Those responses all look great! Let's try another call transcript that has a bit of ambiguity to it to see if the JSON result includes those ambiguities:

```python
ambiguous_call = """
Agent: Thank you for calling Acme Smart Home Support. This is Alex. How may I assist you today?
Customer: Hi Alex, I'm having an issue with my SmartLock. It's not working properly.
Agent: I'm sorry to hear that. Can you tell me more about what's happening with your SmartLock?
Customer: Well, sometimes it doesn't lock when I leave the house. I think it might be related to my phone, but I'm not sure.
Agent: I see. When you say it doesn't lock, do you mean it doesn't respond to the auto-lock feature, or are you trying to lock it manually through the app?
Customer: Uh, both, I think. Sometimes one works, sometimes the other. It's inconsistent.
Agent: Okay. And you mentioned it might be related to your phone. Have you noticed any pattern, like it works better when you're closer to the door?
Customer: Maybe? I haven't really paid attention to that.
Agent: Alright. Let's try to troubleshoot this. First, can you tell me what model of SmartLock you have?
Customer: I'm not sure. I bought it about six months ago, if that helps.
Agent: That's okay. Can you see a model number on the lock itself?
Customer: I'd have to go check. Can we just assume it's the latest model?
Agent: Well, knowing the exact model would help us troubleshoot more effectively. But let's continue with what we know. Have you tried resetting the lock recently?
Customer: I think so. Or maybe that was my SmartTherm. I've been having issues with that too.
Agent: I see. It sounds like we might need to do a full diagnostic on your SmartLock. Would you be comfortable if I walked you through that process now?
Customer: Actually, I have to run to an appointment. Can I call back later?
Agent: Of course. Before you go, is there a good contact number where our technical team can reach you for a more in-depth troubleshooting session?
Customer: Sure, you can reach me at 555... oh wait, that's my old number. Let me check my new one... You know what, I'll just call back when I have more time.
Agent: I understand. We're here 24/7 when you're ready to troubleshoot. Is there anything else I can help with before you go?
Customer: No, that's it. Thanks.
Agent: You're welcome. Thank you for choosing Acme Smart Home. Have a great day!
"""

summarize_call_with_improved_prompt(ambiguous_call)
```

Great! Everything seems to be working as intended

--- 

## Edge cases

So far, all of the call transcripts we've tried have been relatively straightforward customer service calls. In the real world, we would expect to also encounter transcripts that perhaps we don't want to summarize, including: 

- Calls with connection issues
- Calls with language barriers
- Calls with garbled transcripts
- Calls with irrational or upset customers

Remember, our goal is to summarize these calls to help gauge the effectiveness of the customer service we offer.  If we include these edge-case calls in the summaries, we'll likely get skewed results.

Let's see what happens with some of these edge cases with our current prompt.  Below we've defined some new call transcripts:

```python
wrong_number_call = """
Agent: Acme Smart Home Support, Lisa speaking. How can I help you?
Customer: Is this tech support?
Agent: Yes, this is technical support for Acme Smart Home devices. What can I help you with?
Customer: Sorry, wrong number.
Agent: No problem. Have a nice day.
"""

incomplete_call = """
Agent: Acme Smart Home Support, this is Sarah. How can I assist you today?
Customer: The thing isn't working.
Agent: I'm sorry to hear that. Could you please specify which device you're having trouble with?
Customer: You know, the usual one. Gotta go, bye.
Agent: Wait, I need more infor... [call disconnected]
"""

garbled_call = """
Agent: Thank you for calling Acme Smart Home Support. This is Alex. How may I assist you today?
Customer: [garbled voice]
Agent: Hello? Are you there?
"""

language_barrier_call = """
Agent: Acme Smart Home Support, Sarah speaking. How can I help you today?
Customer: [Speaking in Spanish]
Agent: I apologize, but I don't speak Spanish. Do you speak English?
Customer: [Continues Spanish]
Agent: One moment please, I'll try to get a translator on the line...
"""
```

Let's run these edge-case transcripts through our prompt and see what sort of results we get:

```python
summarize_call_with_improved_prompt(wrong_number_call)
```

```python
summarize_call_with_improved_prompt(incomplete_call)
```

```python
summarize_call_with_improved_prompt(garbled_call)
```

```python
summarize_call_with_improved_prompt(language_barrier_call)
```

Unfortunately, we're getting full summaries for these edge-case transcripts.  Here are some problematic parts of the responses: 

>  "customerIssue": "Customer spoke in a language the agent did not understand (Spanish)."

> "customerIssue": "Unclear due to garbled voice from the customer"

> "customerIssue": "The customer dialed the wrong number for technical support" 

Remember that our goal is to summarize our customer service calls to get some insight into how effective our customer service team is.  These edge-case transcripts are resulting in complete summaries that will cause problems when analyzing all the summaries.  We'll need to decide on a strategy for handling these calls.

--- 

## Further prompt improvements

As we previously saw, our prompt is currently generating full summaries for edge-case transcripts.  We want to change this behavior.  We have a couple of options for how we handle these edge-cases:

- Flag them in some way to indicate they are not summarizable, allowing for later human-review.
- Categorize them separately (e.g., "technical difficulty,"  "language barrier,"  etc.).

For simplicity's sake, we'll opt to flag these edge-case calls by asking the model to output JSON that looks like this: 

```json
{
  "status": "INSUFFICIENT_DATA"
}
```

In order to make this work, we'll need to update our prompt in the following ways:
- Add instructions explaining the desired "INSUFFICIENT_DATA" output
- Add examples to show summarizable and non-summarizable transcripts along with their corresponding JSON outputs.

### Updating our instructions

Let's write a new part of the instructions portion of the prompt to explain when the model should output our "INSUFFICIENT_DATA" JSON.

```python
# Just the new content.  We'll look at the entire prompt in a moment
new_instructions_addition = """
Insufficient data criteria:
   If either of these conditions are met:
   a) The transcript has fewer than 5 total exchanges, or
   b) The customer's issue is unclear
   c) The call is garbled, incomplete, or is hindered by a language barrier
   Then return ONLY the following JSON:
   {
     "status": "INSUFFICIENT_DATA"
   }
"""
```

### Adding examples

As we discussed previously in this course, it's almost always a good idea to add examples to a prompt.  In this specific use case, examples will help Claude generally understand the types of summaries we want for both summarizable and non-summarizable call transcripts.

Here's a set of examples we could include in our prompt:

```python
examples_for_prompt = """
<examples>
1. Complete interaction:
<transcript>
Agent: Thank you for calling Acme Smart Home Support. This is Alex. How may I assist you today?
Customer: Hi Alex, my Acme SmartTherm isn't maintaining the temperature I set. It's set to 72 but the house is much warmer.
Agent: I'm sorry to hear that. Let's troubleshoot. Is your SmartTherm connected to Wi-Fi?
Customer: Yes, the Wi-Fi symbol is showing on the display.
Agent: Great. Let's recalibrate your SmartTherm. Press and hold the menu button for 5 seconds.
Customer: Okay, done. A new menu came up.
Agent: Perfect. Navigate to "Calibration" and press select. Adjust the temperature to match your room thermometer.
Customer: Alright, I've set it to 79 degrees to match.
Agent: Great. Press select to confirm. It will recalibrate, which may take a few minutes. Check back in an hour to see if it's fixed.
Customer: Okay, I'll do that. Thank you for your help, Alex.
Agent: You're welcome! Is there anything else I can assist you with today?
Customer: No, that's all. Thanks again.
Agent: Thank you for choosing Acme Smart Home. Have a great day!
</transcript>

<thinking>
Main issue: SmartTherm not maintaining set temperature
Resolution: Guided customer through recalibration process
Follow-up: Not required, but customer should check effectiveness after an hour
Ambiguities: None identified
</thinking>

<json>
{
  "summary": {
    "customerIssue": "SmartTherm not maintaining set temperature, showing higher than set 72 degrees",
    "resolution": "Guided customer through SmartTherm recalibration process",
    "followUpRequired": false,
    "followUpDetails": null
  },
  "status": "COMPLETE",
  "ambiguities": []
}
</json>

2. Interaction requiring follow-up:
<transcript>
Agent: Acme Smart Home Support, this is Jamie. How can I help you?
Customer: Hi, I just installed my new Acme SmartCam, but I can't get it to connect to my Wi-Fi.
Agent: I'd be happy to help. Are you using the Acme Smart Home app?
Customer: Yes, I have the app on my phone.
Agent: Great. Make sure your phone is connected to the 2.4GHz Wi-Fi network, not the 5GHz one.
Customer: Oh, I'm on the 5GHz network. Should I switch?
Agent: Yes, please switch to the 2.4GHz network. The SmartCam only works with 2.4GHz.
Customer: Okay, done. Now what?
Agent: Open the app, select 'Add Device', choose 'SmartCam', and follow the on-screen instructions.
Customer: It's asking for a password now.
Agent: Enter your Wi-Fi password and it should connect.
Customer: It's still not working. I keep getting an error message.
Agent: I see. In that case, I'd like to escalate this to our technical team. They'll contact you within 24 hours.
Customer: Okay, that sounds good. Thank you for trying to help.
Agent: You're welcome. Is there anything else you need assistance with?
Customer: No, that's all for now. Thanks again.
Agent: Thank you for choosing Acme Smart Home. Have a great day!
</transcript>

<thinking>
Main issue: Customer unable to connect new SmartCam to Wi-Fi
Resolution: Initial troubleshooting unsuccessful, issue escalated to technical team
Follow-up: Required, technical team to contact customer within 24 hours
Ambiguities: Specific error message customer is receiving not mentioned
</thinking>

<json>
{
  "summary": {
    "customerIssue": "Unable to connect new SmartCam to Wi-Fi",
    "resolution": "Initial troubleshooting unsuccessful, issue escalated to technical team",
    "followUpRequired": true,
    "followUpDetails": "Technical team to contact customer within 24 hours for further assistance"
  },
  "status": "COMPLETE",
  "ambiguities": ["Specific error message customer is receiving not mentioned"]
}
</json>

3. Insufficient data:
<transcript>
Agent: Acme Smart Home Support, this is Sam. How may I assist you?
Customer: Hi, my smart lock isn't working.
Agent: I'm sorry to hear that. Can you tell me more about the issue?
Customer: It just doesn't work. I don't know what else to say.
Agent: Okay, when did you first notice the problem? And what model of Acme smart lock do you have?
Customer: I don't remember. Listen, I have to go. I'll call back later.
Agent: Alright, we're here 24/7 if you need further assistance. Have a good day.
</transcript>

<thinking>
This transcript has fewer than 5 exchanges and the customer's issue is unclear. The customer doesn't provide specific details about the problem with the smart lock or respond to the agent's questions. This interaction doesn't provide sufficient information for a complete summary.
</thinking>

<json>
{
  "status": "INSUFFICIENT_DATA"
}
</json>
</examples>
"""
```

Note that the examples cover three different situations: 
* A complete interaction that does not require follow up
* A complete interaction that does require follow up and contains ambiguities
* A non-summarizable interaction that contains insufficient data

When providing examples to Claude, it's important to cover a variety of input/output pairs.

--- 

## Our final prompt

Let's combine our initial prompt with the additions we made in the previous section:
* the instructions on handling calls with insufficient data
* the set of example inputs and outputs

This is the new complete prompt:

```python
system = """
You are an expert customer service analyst, skilled at extracting key information from call transcripts and summarizing them in a structured format.
Your task is to analyze customer service call transcripts and generate concise, accurate summaries while maintaining a professional tone.
"""

prompt = """
Analyze the following customer service call transcript and generate a JSON summary of the interaction:

<transcript>
[INSERT CALL TRANSCRIPT HERE]
</transcript>

Instructions:
<instructions>
1. Read the transcript carefully.
2. Analyze the transcript, focusing on the main issue, resolution, and any follow-up required.
3. Generate a JSON object summarizing the key aspects of the interaction according to the specified structure.

Important guidelines:
- Confidentiality: Omit all specific customer data like names, phone numbers, and email addresses.
- Character limit: Restrict each text field to a maximum of 100 characters.
- Maintain a professional tone in your summary.

Output format:
Generate a JSON object with the following structure:
<json>
{
  "summary": {
    "customerIssue": "Brief description of the main problem or reason for the call",
    "resolution": "How the issue was addressed or resolved, if applicable",
    "followUpRequired": true/false,
    "followUpDetails": "Description of any necessary follow-up actions, or null if none required"
  },
  "status": "COMPLETE",
  "ambiguities": ["List of any unclear or vague points in the conversation, or an empty array if none"]
}
</json>

Insufficient data criteria:
   If any of these conditions are met:
   a) The transcript has fewer than 5 total exchanges
   b) The customer's issue is unclear
   c) The call is garbled, incomplete, or is hindered by a language barrier
   Then return ONLY the following JSON:
   {
     "status": "INSUFFICIENT_DATA"
   }

Examples:
<examples>
1. Complete interaction:
<transcript>
Agent: Thank you for calling Acme Smart Home Support. This is Alex. How may I assist you today?
Customer: Hi Alex, my Acme SmartTherm isn't maintaining the temperature I set. It's set to 72 but the house is much warmer.
Agent: I'm sorry to hear that. Let's troubleshoot. Is your SmartTherm connected to Wi-Fi?
Customer: Yes, the Wi-Fi symbol is showing on the display.
Agent: Great. Let's recalibrate your SmartTherm. Press and hold the menu button for 5 seconds.
Customer: Okay, done. A new menu came up.
Agent: Perfect. Navigate to "Calibration" and press select. Adjust the temperature to match your room thermometer.
Customer: Alright, I've set it to 79 degrees to match.
Agent: Great. Press select to confirm. It will recalibrate, which may take a few minutes. Check back in an hour to see if it's fixed.
Customer: Okay, I'll do that. Thank you for your help, Alex.
Agent: You're welcome! Is there anything else I can assist you with today?
Customer: No, that's all. Thanks again.
Agent: Thank you for choosing Acme Smart Home. Have a great day!
</transcript>

<thinking>
Main issue: SmartTherm not maintaining set temperature
Resolution: Guided customer through recalibration process
Follow-up: Not required, but customer should check effectiveness after an hour
Ambiguities: None identified
</thinking>

<json>
{
  "summary": {
    "customerIssue": "SmartTherm not maintaining set temperature, showing higher than set 72 degrees",
    "resolution": "Guided customer through SmartTherm recalibration process",
    "followUpRequired": false,
    "followUpDetails": null
  },
  "status": "COMPLETE",
  "ambiguities": []
}
</json>

2. Interaction requiring follow-up:
<transcript>
Agent: Acme Smart Home Support, this is Jamie. How can I help you?
Customer: Hi, I just installed my new Acme SmartCam, but I can't get it to connect to my Wi-Fi.
Agent: I'd be happy to help. Are you using the Acme Smart Home app?
Customer: Yes, I have the app on my phone.
Agent: Great. Make sure your phone is connected to the 2.4GHz Wi-Fi network, not the 5GHz one.
Customer: Oh, I'm on the 5GHz network. Should I switch?
Agent: Yes, please switch to the 2.4GHz network. The SmartCam only works with 2.4GHz.
Customer: Okay, done. Now what?
Agent: Open the app, select 'Add Device', choose 'SmartCam', and follow the on-screen instructions.
Customer: It's asking for a password now.
Agent: Enter your Wi-Fi password and it should connect.
Customer: It's still not working. I keep getting an error message.
Agent: I see. In that case, I'd like to escalate this to our technical team. They'll contact you within 24 hours.
Customer: Okay, that sounds good. Thank you for trying to help.
Agent: You're welcome. Is there anything else you need assistance with?
Customer: No, that's all for now. Thanks again.
Agent: Thank you for choosing Acme Smart Home. Have a great day!
</transcript>

<thinking>
Main issue: Customer unable to connect new SmartCam to Wi-Fi
Resolution: Initial troubleshooting unsuccessful, issue escalated to technical team
Follow-up: Required, technical team to contact customer within 24 hours
Ambiguities: Specific error message customer is receiving not mentioned
</thinking>

<json>
{
  "summary": {
    "customerIssue": "Unable to connect new SmartCam to Wi-Fi",
    "resolution": "Initial troubleshooting unsuccessful, issue escalated to technical team",
    "followUpRequired": true,
    "followUpDetails": "Technical team to contact customer within 24 hours for further assistance"
  },
  "status": "COMPLETE",
  "ambiguities": ["Specific error message customer is receiving not mentioned"]
}
</json>

3. Insufficient data:
<transcript>
Agent: Acme Smart Home Support, this is Sam. How may I assist you?
Customer: Hi, my smart lock isn't working.
Agent: I'm sorry to hear that. Can you tell me more about the issue?
Customer: It just doesn't work. I don't know what else to say.
Agent: Okay, when did you first notice the problem? And what model of Acme smart lock do you have?
Customer: I don't remember. Listen, I have to go. I'll call back later.
Agent: Alright, we're here 24/7 if you need further assistance. Have a good day.
</transcript>

<thinking>
This transcript has fewer than 5 exchanges and the customer's issue is unclear. The customer doesn't provide specific details about the problem with the smart lock or respond to the agent's questions. This interaction doesn't provide sufficient information for a complete summary.
</thinking>

<json>
{
  "status": "INSUFFICIENT_DATA"
}
</json>
</examples>
</instructions>

Before generating the JSON, please analyze the transcript in <thinking> tags.
Include your identification of the main issue, resolution, follow-up requirements, and any ambiguities.
Then, provide your JSON output in <json> tags.
"""
```

The above prompt is quite long, but here is the general structure:
- The system prompt sets the context, role, and tone for the model.
- The main prompt includes the following:
    - the call transcript
    - a set of instructions containing:
        - general instructions
        - guidelines 
        - output format requirements
        - details on handling edge-case calls
        - examples
    - details on the XML tags to use in the output

Here's a summary to help visualize the flow of the prompt: 

```txt
Analyze the following customer service call transcript and generate a JSON summary of the interaction:

<transcript>
[INSERT CALL TRANSCRIPT HERE]
</transcript>

<instructions>
- General instructions and guidelines
- Output JSON format description
- Insufficient data (edge-case) criteria
<examples>
varied example inputs and outputs
</examples>
</instructions>

Before generating the JSON, please analyze the transcript in <thinking> tags. 
Include your identification of the main issue, resolution, follow-up requirements, and any ambiguities. 
Then, provide your JSON output in <json> tags.

```

Let's test the final prompt with a new function.  Note that this function extracts the JSON summary content inside the `<json>` tags:

```python
import re

def summarize_call_with_final_prompt(transcript):
    final_prompt = prompt.replace("[INSERT CALL TRANSCRIPT HERE]", transcript)
    # Make the API call
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        system=system,
        max_tokens=4096,
        messages=[
            {"role": "user", "content": final_prompt}
        ]
    )

    # Extract content between <json> tags
    json_content = re.search(r'<json>(.*?)</json>', response.content[0].text, re.DOTALL)

    if json_content:
        print(json_content.group(1).strip())
    else:
        print("No JSON content found in the response.")
```

Let's test it out with a bunch of our existing call variables:

```python
summarize_call_with_final_prompt(call1)
```

```python
summarize_call_with_final_prompt(call3)
```

Let's try our call transcript that should result in a summary with a non-empty `ambiguities` array:

```python
summarize_call_with_final_prompt(ambiguous_call)
```

Now let's try some of our edge case prompts that we do not want summarized:

```python
summarize_call_with_final_prompt(garbled_call)
```

```python
summarize_call_with_final_prompt(language_barrier_call)
```

```python
summarize_call_with_final_prompt(incomplete_call)
```

Great! We're getting the exact outputs we want! Let's try pushing it even further:

```python
summarize_call_with_final_prompt("blah blah blah")
```

```python
summarize_call_with_final_prompt("")
```

Excellent, the prompt is handling all of our edge cases!

---

## Wrap up

In this lesson, we walked through the process of developing a complex prompt for summarizing customer service call transcripts. Let's recap the prompting techniques we employed:

* System Prompt: We used a system prompt to set the overall context and role for Claude.
* Structured Input: We placed the call transcript at the beginning of the prompt using XML tags.
* Clear Instructions: We provided detailed guidelines on what to focus on and how to structure the output.
* Output Formatting: We specified a JSON structure for the summary, ensuring consistent and easily parseable results.
* Handling Edge Cases: We added criteria for identifying calls with insufficient data.
* Examples: We included diverse examples to illustrate desired outputs for different scenarios.
* Thinking Aloud: We asked Claude to show its analysis in <thinking> tags before providing the final JSON output.


By employing these techniques, we created a robust prompt capable of generating structured summaries for a wide range of customer service call transcripts, while appropriately handling edge cases. This approach can be adapted to many other complex prompting scenarios beyond call summarization.


**Important Note:** While we've developed a sophisticated prompt that appears to handle our test cases well, it's crucial to understand that this prompt is not yet production-ready. What we've created is a promising starting point, but it requires extensive testing and evaluation before it can be reliably used in a real-world setting. Our current eye-ball test evaluation has been based on a small set of examples. This is not representative of the diverse and often unpredictable nature of real customer service calls. To ensure the prompt's effectiveness and reliability, we need to implement a comprehensive evaluation process that includes quantitative metrics.  Robust, data-driven evaluations are the key to bridging the gap between a promising prototype and a reliable, production-grade solution.