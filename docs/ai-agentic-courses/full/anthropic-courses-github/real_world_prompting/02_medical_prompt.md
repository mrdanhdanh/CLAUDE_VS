# Lesson 2: A real-world prompt

In the previous lesson, we discussed several key prompting tips and saw an example of how to use each in isolation. Let's now try writing a much larger prompt that incorporates many of the techniques we just covered.

---

## Our prompting goal
This lesson will focus on writing a medical record summarizer prompt that takes in long medical records and generates a summary containing important information to assist doctors in preparing for upcoming appointments.

Each patient medical record looks something like this: 

```
Patient Name: Evelyn Thompson
Age: 78
Medical Record:

1985: Diagnosed with type 2 diabetes, started on metformin
1992: Developed hypertension, prescribed lisinopril
1998: Total hip replacement (right) due to osteoarthritis
2000: Diagnosed with hypothyroidism, started on levothyroxine
2003: Cataract surgery (both eyes)
2005: Admitted for atrial fibrillation, started on warfarin
2008: Vitamin B12 deficiency diagnosed, monthly injections started
2010: Increased metformin dose due to rising A1C levels
2011: Admitted for transient ischemic attack (TIA), added aspirin to regimen
2013: Diagnosed with stage 2 breast cancer, underwent lumpectomy and radiation
2014: Started on anastrozole for breast cancer recurrence prevention
2015: Developed chronic kidney disease (CKD) stage 3, metformin adjusted
2017: Total knee replacement (left) due to osteoarthritis
2018: Hospitalized for pneumonia, treated with IV antibiotics
2019: Mild cognitive impairment noted, started on donepezil
2020: Lisinopril dosage increased due to refractory hypertension
2021: Recurrent UTIs, prescribed low-dose prophylactic antibiotics
2022: Annual mammogram clear, but eGFR shows worsening kidney function
2023: Mobility declining, started physical therapy and home health aide visits
```

Our end goal is to generate consistent record summaries to help providers prepare for upcoming appointments.  Each summary should contain key pieces of information including: 

* The patient's name
* The patient's age
* Key diagnoses
* A list of medications the patient is prescribed 
* Recent concerns
* Action items for the provider

 An example output for the above medical record might look something like this: 

```
Name: Evelyn Thompson
Age: 78

Key Diagnoses:
- Type 2 Diabetes (1985)
- Hypertension (1992)
- Osteoarthritis (Hip and Knee Replacements in 1998 and 2017)
- Hypothyroidism (2000)
- Atrial Fibrillation (2005)
- Vitamin B12 Deficiency (2008)
- Transient Ischemic Attack (TIA) (2011)
- Breast Cancer (2013)
- Chronic Kidney Disease (CKD) Stage 3 (2015)
- Pneumonia (2018)
- Mild Cognitive Impairment (2019)
- Recurrent Urinary Tract Infections (UTIs) (2021)

Medications:
- Metformin (Diabetes)
- Lisinopril (Hypertension)
- Levothyroxine (Hypothyroidism)
- Warfarin (Atrial Fibrillation)
- Aspirin (Antiplatelet)
- Anastrozole (Breast Cancer Recurrence Prevention)
- Donepezil (Cognitive Impairment)
- Low-dose Prophylactic Antibiotics (Recurrent UTIs)

Other Treatments:
- Total Hip Replacement (1998)
- Cataract Surgery (2003)
- Vitamin B12 Injections (2008)
- Lumpectomy and Radiation (Breast Cancer, 2013)
- Total Knee Replacement (2017)
- Physical Therapy and Home Health Aide (2023)

Recent Concerns:
- Worsening Kidney Function (eGFR Decline in 2022)
- Declining Mobility (2023)

Action Items:
- Monitor Kidney Function and Adjust Medications as Needed
- Continue Physical Therapy and Home Health Support
- Evaluate for Cognitive Decline and Adjust Treatment Plan
- Address Mobility Issues and Fall Risk
- Ensure Adherence to Recommended Cancer Screening
```

Here's a Python list containing 5 medical records that we'll try our prompt with:

```python
patient_records = [
    """
Patient Name: Evelyn Thompson
Age: 78
Medical Record:

1985: Diagnosed with type 2 diabetes, started on metformin
1992: Developed hypertension, prescribed lisinopril
1998: Total hip replacement (right) due to osteoarthritis
2000: Diagnosed with hypothyroidism, started on levothyroxine
2003: Cataract surgery (both eyes)
2005: Admitted for atrial fibrillation, started on warfarin
2008: Vitamin B12 deficiency diagnosed, monthly injections started
2010: Increased metformin dose due to rising A1C levels
2011: Admitted for transient ischemic attack (TIA), added aspirin to regimen
2013: Diagnosed with stage 2 breast cancer, underwent lumpectomy and radiation
2014: Started on anastrozole for breast cancer recurrence prevention
2015: Developed chronic kidney disease (CKD) stage 3, metformin adjusted
2017: Total knee replacement (left) due to osteoarthritis
2018: Hospitalized for pneumonia, treated with IV antibiotics
2019: Mild cognitive impairment noted, started on donepezil
2020: Lisinopril dosage increased due to refractory hypertension
2021: Recurrent UTIs, prescribed low-dose prophylactic antibiotics
2022: Annual mammogram clear, but eGFR shows worsening kidney function
2023: Mobility declining, started physical therapy and home health aide visits
    """,
    """
Patient Name: Marcus Reyes
Age: 42
Medical Record:

2001: Diagnosed with generalized anxiety disorder (GAD), started on paroxetine
2003: Diagnosed with major depressive disorder (MDD), added bupropion
2005: Hospitalized for suicidal ideation, added cognitive behavioral therapy (CBT)
2007: Diagnosed with attention-deficit/hyperactivity disorder (ADHD), started on methylphenidate
2009: Reported side effects from paroxetine, switched to escitalopram
2012: Diagnosed with obstructive sleep apnea (OSA), started CPAP therapy
2014: Diagnosed with hypertension, started on losartan
2015: Weight gain noted, referred to nutritionist
2016: Diagnosed with type 2 diabetes, started on metformin
2017: Hospitalized for diabetic ketoacidosis (DKA), insulin therapy initiated
2018: Reported nightmares, switched from bupropion to venlafaxine
2019: Gastroesophageal reflux disease (GERD) diagnosis, started on omeprazole
2020: Divorce, increased therapy sessions, added dialectical behavior therapy (DBT)
2021: Developed plantar fasciitis, prescribed orthotics and physical therapy
2022: Admitted for panic attack, mistaken for myocardial infarction, cardiac workup negative
2023: Attempted suicide, inpatient psychiatric treatment for 30 days
2023: Post-discharge, started on new antipsychotic (quetiapine) and mood stabilizer (lamotrigine)
2024: Reports improvement in mood and sleep, weight loss noted
2024: A1C levels improved, insulin dose decreased
    """,
    """
Patient Name: Lily Chen
Age: 8
Medical Record:

2016 (Birth): Born at 34 weeks, diagnosed with Tetralogy of Fallot (TOF)
  - Immediate surgery to place a shunt for increased pulmonary blood flow
2016 (3 months): Echocardiogram showed worsening right ventricular hypertrophy
2017 (8 months): Complete repair of TOF (VSD closure, pulmonary valve replacement, RV outflow tract repair)
2017 (10 months): Developed post-operative arrhythmias, started on amiodarone
2018 (14 months): Developmental delay noted, referred to early intervention services
2018 (18 months): Speech therapy initiated for delayed language development
2019 (2 years): Diagnosed with failure to thrive, started on high-calorie diet
2019 (2.5 years): Occupational therapy started for fine motor skill delays
2020 (3 years): Cardiac catheterization showed mild pulmonary stenosis
2020 (3.5 years): Diagnosed with sensory processing disorder (SPD)
2021 (4 years): Started integrated preschool program with IEP (Individualized Education Plan)
2021 (4.5 years): Hospitalized for RSV bronchiolitis, required brief oxygen support
2022 (5 years): Echocardiogram showed progression of pulmonary stenosis, balloon valvuloplasty performed
2022 (5.5 years): Diagnosed with attention-deficit/hyperactivity disorder (ADHD), started behavioral therapy
2023 (6 years): Cochlear implant surgery for sensorineural hearing loss
2023 (7 years): Started mainstream school with continued IEP support
2024 (7.5 years): Occupational therapy discontinued, met fine motor skill goals
2024 (8 years): Periodic cardiac follow-up shows stable pulmonary valve function
2024 (8 years): Speech development progressing well, ongoing therapy
    """,
    """
Patient Name: Jason Tran
Age: 25
Medical Record:

2010 (11 yrs): Diagnosed with asthma, started on albuterol inhaler
2012 (13 yrs): First football concussion, brief loss of consciousness
2013 (14 yrs): Fractured right tibia during soccer, surgical fixation
2014 (15 yrs): Second concussion, resulting in post-concussion syndrome
  - Symptoms: headaches, dizziness, memory problems
  - Referred to pediatric neurologist, cognitive rehabilitation therapy
2015 (16 yrs): Developed anxiety and depression, started on fluoxetine
2016 (17 yrs): ACL tear (left knee) during basketball, reconstructive surgery
  - 6-month rehabilitation, switched to non-contact sports
2017 (18 yrs): Graduated high school, started college on academic scholarship
2018 (19 yrs): Diagnosed with PTSD related to sports injuries
  - Started cognitive-behavioral therapy (CBT)
2019 (20 yrs): Tried to return to basketball, experienced panic attack
  - Increased therapy sessions, added exposure therapy
2020 (21 yrs): COVID-19 pandemic, remote learning, reported increased anxiety
  - Started mindfulness meditation and yoga
2021 (22 yrs): Diagnosed with sleep apnea, started CPAP therapy
  - Sleep study suggested link between concussions and sleep disorder
2022 (23 yrs): Gradual return to low-impact sports (swimming, cycling)
  - Reported improved mood and sleep quality
2023 (24 yrs): Graduated college, started job in sports analytics
  - Continuing therapy, now biweekly
  - Volunteering with youth concussion awareness program
2024 (25 yrs): Annual check-up - asthma well-controlled, mental health stable
  - No sports-related injuries in past 2 years
  - Training for first half-marathon
    """,
    """
Patient Name: Amira Khan
Age: 36
Medical Record:

2011: Recurrent joint pain and fatigue, initial diagnosis of fibromyalgia
  - Started on pregabalin and physical therapy
2012: Developed persistent rash and photosensitivity
  - Dermatologist diagnosed cutaneous lupus (CLE)
  - Started on topical corticosteroids and sunscreen
2013: Complained of severe fatigue, hair loss, and cognitive issues ("brain fog")
  - Blood tests showed positive ANA and anti-dsDNA antibodies
  - Diagnosed with Systemic Lupus Erythematosus (SLE)
  - Started on hydroxychloroquine and low-dose prednisone
2014: Hospitalized for lupus nephritis (class III)
  - Renal biopsy confirmed diagnosis
  - Started on mycophenolate mofetil and increased prednisone
2015: Developed interstitial lung disease (ILD) secondary to SLE
  - Started on cyclophosphamide pulse therapy
  - Required home oxygen therapy
2016: Diagnosed with secondary Sjögren's syndrome
  - Symptoms: dry eyes, dry mouth
  - Started on pilocarpine and artificial tears
2017: Hospitalized for lupus cerebritis
  - Symptoms: seizures, confusion, memory loss
  - MRI showed brain inflammation
  - Treated with high-dose steroids and rituximab
2018: Developed avascular necrosis (AVN) of hip, steroid-induced
  - Underwent total hip replacement surgery
2019: Started on belimumab to reduce flare frequency
  - Gradual reduction in prednisone dosage
2020: COVID-19 pandemic, self-isolated due to immunosuppression
  - Telemedicine follow-ups, home infusions
2021: Diagnosed with steroid-induced diabetes
  - Started on metformin and insulin
  - Referred to endocrinologist and nutritionist
2022: Flare-up of lupus, increased joint pain and fatigue
  - Adjusted medications: increased mycophenolate, added abatacept
2023: Cardiovascular screening due to long-term steroid use
  - Echo showed early signs of diastolic dysfunction
  - Started on ACE inhibitors, referred to cardio-rehab
2024: Improvement noted in all organ systems
  - Tapering immunosuppressants, monitoring closely
  - Continues physical therapy, yoga for joint health
  - Planning pregnancy, consulted with high-risk OB
    """
]
```

Let's take a look at one, just to make sure our list working properly:

```python
patient_records[2]
```

---

## Our initial "bad" prompt

Let's start with a very simple prompt that asks Claude to generate us a summary. A very simple first attempt might look something like this:

> I have this patient medical record. Can you summarize it for me?
> 
> {medical record goes here}
> 
> I need this for a quick review before the patient's appointment tomorrow.

Let's formalize this into a specific prompt that we can use with a dynamically inserted medical record:

```python
initial_prompt = """
I have this patient medical record. Can you summarize it for me?

{record}

I need this for a quick review before the patient's appointment tomorrow.
"""
```

Next, let's write a simple function that will accept a single medical record, insert it into our prompt, and get Claude to generate a summary:

```python
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()
client = Anthropic()

def generate_summary_with_bad_prompt(patient_record):
    prompt_with_record = initial_prompt.format(record=patient_record)
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt_with_record}]
    )
    print("===============================")
    print(response.content[0].text)
```

Let's try it will all 5 of the medical records we have in the `patient_records` list:

```python
generate_summary_with_bad_prompt(patient_records[0])
```

```python
generate_summary_with_bad_prompt(patient_records[1])
```

```python
generate_summary_with_bad_prompt(patient_records[2])
```

```python
generate_summary_with_bad_prompt(patient_records[3])
```

```python
generate_summary_with_bad_prompt(patient_records[4])
```

If we take a closer look at the summaries we got from Claude, they're all over the place! Some summaries are just long paragraphs of text. Other summaries are broken down into bulleted lists. The actual content of each summary differs radically. The summary content isn't terrible, but the formatting, length, and types of summary data are inconsistent and would be difficult to use programmatically. Let's improve it!

---

## Improving the prompt

As we learned in the previous lesson, there are a clear set of prompting techniques that could help us get better and more consistent results, including:

* Adding a clear system prompt to set the context and role for the assistant, such as a medical professional or a healthcare data analyst
* Structuring the input data using XML tags (e.g., `<patient_record>`) to make it clear what part of the prompt is the input data
* Provide clear, specific instructions on what the summary should focus on, such as diagnoses, medications, and recent health concerns
* Specify the desired format for the summary, such as bullet points or a structured format with specific sections
* Include an example of a well-formatted summary to guide the assistant's response
* Use some sort of output XML tag to structure the output, making it easy for the user to find the relevant information quickly

**In upcoming lessons, we'll discuss a specific, nuanced approach to prompt engineering and selecting prompting techniques. In this lesson we'll take a "shotgun" approach and use all of them at once.**

### Adding a system prompt
Let's tackle these suggestions one at a time. We'll begin by defining a system prompt to set the context and role for the assistant. In our experience, this is the only information that should go in the system prompt.

For our use case, our system prompt should tell Claude that its role is to act as a medical professional that is talented at translating long patient histories into concise summaries.

Here's one approach:

```python
system = """
You are a highly experienced medical professional with a specialty in translating complex patient histories into concise, actionable summaries.
Your role is to analyze patient records, identify critical information, and present it in a clear, structured format that aids in diagnosis and treatment planning.
Your summaries are invaluable for busy healthcare providers who need quick insights into a patient's medical history before appointments.
"""
```

### Structuring input data
One of the most important prompting tips when working with Claude is to clearly label your input data using XML tags. In our current prompt, we're providing a medical history as the main input like this: 

> I have this patient medical record. Can you summarize it for me?
> 
> {medical record goes here}
> 
> I need this for a quick review before the patient's appointment tomorrow.

A simple addition that can lead to substantial improvement is to use XML tags to wrap our input data.  Let's update our prompt to do this using `<patient_record>` tags

```python
#System Prompt
system = """
You are a highly experienced medical professional with a specialty in translating complex patient histories into concise, actionable summaries.
Your role is to analyze patient records, identify critical information, and present it in a clear, structured format that aids in diagnosis and treatment planning.
Your summaries are invaluable for busy healthcare providers who need quick insights into a patient's medical history before appointments.
"""

#Improved Prompt (still a work in progress!)
updated_prompt = """
<patient_record>
{record}
</patient_record>
"""
```

### Provide clear instructions
When working with Claude, providing clear and direct instructions is essential for achieving the best results. Just as when we instruct a human for the first time on a task, the more we explain exactly what we want in a straightforward manner, the better and more accurate Claude’s response will be.

In our initial "bad" prompt, we had the following instructions:

> I have this patient medical record. Can you summarize it for me?

This is woefully vague! We need to come up with a set of clear and specific instructions. What exactly do we want the summary to look like? 

Let's say that we want the summary to include the following distinct categories of information:

* The patient's name
* The patient's age
* A list of key diagnoses
* A list of medications the patient is prescribed
* A list of non-medication treatments (physical therapy, CBT, etc.)
* A list of recent concerns
* A list of important action items for a physician

​
It's also important that we specify the exact output format that we're after, so we'll make sure to ask Claude for bulleted lists instead of just a generic "list."

Here's an updated version of our prompt:

```python
#System Prompt
system = """
You are a highly experienced medical professional with a specialty in translating complex patient histories into concise, actionable summaries.
Your role is to analyze patient records, identify critical information, and present it in a clear, structured format that aids in diagnosis and treatment planning.
Your summaries are invaluable for busy healthcare providers who need quick insights into a patient's medical history before appointments.
"""

#Improved Prompt (still a work in progress!)
updated_prompt = """
I need your help summarizing patient medical records for our team of doctors.
We have a series of follow-up appointments tomorrow, and the doctors need quick, insightful summaries to prepare.

Each summary should include the following elements in this order:
- The patient's name
- The patients age
- A bulleted list of key diagnoses in chronological order
- A bulleted list of medications the patient is prescribed
- A bulleted list of other treatments: non-medication treatments like CBT or physical therapy
- A short bulleted list of recent concerns
- A bulleted list of key action items to help our doctors prepare for the upcoming patient visit

<patient_record>
{record}
</patient_record>
"""
```

### Adding examples

Examples are one of the most powerful tools for enhancing Claude’s performance and guiding it to produce a desired output. By providing a few well-crafted examples in our prompt, we can significantly improve the accuracy, consistency, and quality of Claude’s responses. This technique is particularly effective for tasks that are highly detailed or require structured outputs or adherence to specific formats.

At the moment, our prompt does not include any examples at all.  To keep things brief, we'll include a single example, though it's often better to have at least two.  

We'll base our example input and output on this medical history: 

```
Patient Name: Ethan Blackwood
Age: 55
Medical Record:

2010: Annual check-up, mild hypertension noted
  - Started on lifestyle modifications (diet, exercise)
2012: Diagnosed with moderate depression following job loss
  - Started on sertraline and cognitive-behavioral therapy (CBT)
2014: New job, reported improved mood
  - Continued sertraline, reduced CBT sessions
2015: Mild back pain, diagnosed with early degenerative disc disease
  - Physical therapy and over-the-counter NSAIDs prescribed
2016: Hypertension worsened, started on lisinopril
2017: Routine colonoscopy showed benign polyps, removed during procedure
2018: Developed persistent cough, chest X-ray clear
  - Diagnosed with Gastroesophageal Reflux Disease (GERD)
  - Started on omeprazole
2019: Diagnosed with obstructive sleep apnea (OSA)
  - Started CPAP therapy, reported improved energy levels
2020: COVID-19 pandemic, worked from home
  - Reported increased anxiety, CBT sessions resumed (telehealth)
  - COVID-19 vaccination (Moderna, both doses)
2021: Mild knee pain, MRI showed minor meniscus tear
  - Arthroscopic surgery recommended, patient opted for conservative management
2022: Annual check-up showed pre-diabetes (A1C: 6.1%)
  - Intensified lifestyle modifications, referred to nutritionist
- Discontinued omeprazole due to resolved GERD symptoms
2023: Blood tests showed elevated PSA (Prostate-Specific Antigen)
  - Prostate biopsy performed, results negative for cancer
- Knee pain worsened, agreed to arthroscopic surgery
2024: Post-op knee recovery: good, continuing physical therapy
  - A1C levels improved (5.8%), pre-diabetes resolved
  - Stress test normal, but mild LVH on echocardiogram
  - Started on low-dose ACE inhibitor for cardioprotection
```

Given this example input, a well-structured output that follows our prompt's rules might look like this: 

```
Name: Ethan Blackwood
Age: 55  

Key Diagnoses:
- Hypertension (2010)
- Depression (2012)
- Degenerative Disc Disease (2015) 
- Gastroesophageal Reflux Disease (GERD) (2018)
- Obstructive Sleep Apnea (OSA) (2019)
- Pre-diabetes (2022)
- Meniscus Tear (2021)
- Left Ventricular Hypertrophy (LVH) (2024)

Medications: 
- Sertraline (depression)
- Lisinopril (hypertension)
- Omeprazole (GERD) - discontinued in 2022
- Low-dose ACE inhibitor (cardioprotection - 2024)

Other Treatments:
- Cognitive Behavioral Therapy (CBT) (depression)
- Physical therapy (back pain, post-op knee recovery)
- CPAP therapy (OSA)
- Arthroscopic knee surgery (2023)

Recent Concerns:
- Worsening knee pain
- Elevated PSA (2023) 
- Left ventricular hypertrophy on echocardiogram (2024)

Action Items:  
- Follow up on post-op knee recovery and physical therapy  
- Monitor PSA levels and prostate health
- Optimize blood pressure and hypertension management
- Assess need for further cardiac workup after LVH finding

```

Let's update our prompt to include this example input and output.  To make things extra clear to Claude, we'll make sure to wrap our example inside of `<example>` tags:

```python
#System Prompt
system = """
You are a highly experienced medical professional with a specialty in translating complex patient histories into concise, actionable summaries.
Your role is to analyze patient records, identify critical information, and present it in a clear, structured format that aids in diagnosis and treatment planning.
Your summaries are invaluable for busy healthcare providers who need quick insights into a patient's medical history before appointments.
"""

#Improved Prompt (still a work in progress!)
updated_prompt = """
I need your help summarizing patient medical records for our team of doctors.
We have a series of follow-up appointments tomorrow, and the doctors need quick, insightful summaries to prepare.

Each summary should include the following elements in this order:
- The patient's name
- The patients age
- A bulleted list of key diagnoses in chronological order
- A bulleted list of medications the patient is prescribed
- A bulleted list of other treatments: non-medication treatments like CBT or physical therapy
- A short bulleted list of recent concerns
- A bulleted list of key action items to help our doctors prepare for the upcoming patient visit

Here's an example of how we'd like the summaries formatted:

<example>
<patient_record>
Patient Name: Ethan Blackwood
Age: 55
Medical Record:

2010: Annual check-up, mild hypertension noted
  - Started on lifestyle modifications (diet, exercise)
2012: Diagnosed with moderate depression following job loss
  - Started on sertraline and cognitive-behavioral therapy (CBT)
2014: New job, reported improved mood
  - Continued sertraline, reduced CBT sessions
2015: Mild back pain, diagnosed with early degenerative disc disease
  - Physical therapy and over-the-counter NSAIDs prescribed
2016: Hypertension worsened, started on lisinopril
2017: Routine colonoscopy showed benign polyps, removed during procedure
2018: Developed persistent cough, chest X-ray clear
  - Diagnosed with Gastroesophageal Reflux Disease (GERD)
  - Started on omeprazole
2019: Diagnosed with obstructive sleep apnea (OSA)
  - Started CPAP therapy, reported improved energy levels
2020: COVID-19 pandemic, worked from home
  - Reported increased anxiety, CBT sessions resumed (telehealth)
  - COVID-19 vaccination (Moderna, both doses)
2021: Mild knee pain, MRI showed minor meniscus tear
  - Arthroscopic surgery recommended, patient opted for conservative management
2022: Annual check-up showed pre-diabetes (A1C: 6.1%)
  - Intensified lifestyle modifications, referred to nutritionist
- Discontinued omeprazole due to resolved GERD symptoms
2023: Blood tests showed elevated PSA (Prostate-Specific Antigen)
  - Prostate biopsy performed, results negative for cancer
- Knee pain worsened, agreed to arthroscopic surgery
2024: Post-op knee recovery: good, continuing physical therapy
  - A1C levels improved (5.8%), pre-diabetes resolved
  - Stress test normal, but mild LVH on echocardiogram
  - Started on low-dose ACE inhibitor for cardioprotection
</patient_record>


Your output:

Name: Ethan Blackwood
Age: 55

Key Diagnoses:
- Hypertension (2010)
- Depression (2012)
- Degenerative Disc Disease (2015)
- Gastroesophageal Reflux Disease (GERD) (2018)
- Obstructive Sleep Apnea (OSA) (2019)
- Pre-diabetes (2022)
- Meniscus Tear (2021)
- Left Ventricular Hypertrophy (LVH) (2024)

Medications:
- Sertraline (depression)
- Lisinopril (hypertension)
- Omeprazole (GERD) - discontinued in 2022
- Low-dose ACE inhibitor (cardioprotection - 2024)

Other Treatments:
- Cognitive Behavioral Therapy (CBT) (depression)
- Physical therapy (back pain, post-op knee recovery)
- CPAP therapy (OSA)
- Arthroscopic knee surgery (2023)

Recent Concerns:
- Worsening knee pain
- Elevated PSA (2023)
- Left ventricular hypertrophy on echocardiogram (2024)

Action Items:
- Follow up on post-op knee recovery and physical therapy
- Monitor PSA levels and prostate health
- Optimize blood pressure and hypertension management
- Assess need for further cardiac workup after LVH finding
</example>

Now, please summarize the following patient record in the same format:
<patient_record>
{record}
</patient_record>
"""
```

### Output XML structure

A common prompting strategy is to ask Claude to use XML tags in its responses. This makes it easier to eventually extract the exact content we care about, even if Claude decides to give us a preamble like "Ok, here's the summary you requested!" or adds in additional content. 

In this case, it might make sense to get Claude to generate the medical record summary inside of `<summary>` tags.  One easy implementation involves updating our example update to show Claude our desired format.  

Currently, the example portion of our prompt looks like this: 

```
Here's an example of how we'd like the summaries formatted:

<example>
<patient_record>
Patient Name: Ethan Blackwood
Age: 55
Medical Record:

2010: Annual check-up, mild hypertension noted
  - Started on lifestyle modifications (diet, exercise)
medical record truncated to keep the text short here...
</patient_record>

Your output: 

Name: Ethan Blackwood
Age: 55  

Key Diagnoses:
- Hypertension (2010)
summary truncated to keep the text short here...
</example>
```

With one simple change, we can indicate to Claude that it should wrap the output inside of `<summary>` tags:

```
Here's an example of how we'd like the summaries formatted:

<example>
<patient_record>
Patient Name: Ethan Blackwood
Age: 55
Medical Record:

2010: Annual check-up, mild hypertension noted
  - Started on lifestyle modifications (diet, exercise)
medical record truncated to keep the text short here...
</patient_record>

<summary>
Name: Ethan Blackwood
Age: 55  

Key Diagnoses:
- Hypertension (2010)
summary truncated to keep the text short here...
</summary>
</example>
```

Let's update the example section of our prompt to reflect this change:

```python
#System Prompt
system = """
You are a highly experienced medical professional with a specialty in translating complex patient histories into concise, actionable summaries.
Your role is to analyze patient records, identify critical information, and present it in a clear, structured format that aids in diagnosis and treatment planning.
Your summaries are invaluable for busy healthcare providers who need quick insights into a patient's medical history before appointments.
"""

#Improved Prompt (still a work in progress!)
updated_prompt = """
I need your help summarizing patient medical records for our team of doctors.
We have a series of follow-up appointments tomorrow, and the doctors need quick, insightful summaries to prepare.

Each summary should include the following elements in this order:
- The patient's name
- The patients age
- A bulleted list of key diagnoses in chronological order
- A bulleted list of medications the patient is prescribed
- A bulleted list of other treatments: non-medication treatments like CBT or physical therapy
- A short bulleted list of recent concerns
- A bulleted list of key action items to help our doctors prepare for the upcoming patient visit

Here's an example of how we'd like the summaries formatted:

<example>
<patient_record>
Patient Name: Ethan Blackwood
Age: 55
Medical Record:

2010: Annual check-up, mild hypertension noted
  - Started on lifestyle modifications (diet, exercise)
2012: Diagnosed with moderate depression following job loss
  - Started on sertraline and cognitive-behavioral therapy (CBT)
2014: New job, reported improved mood
  - Continued sertraline, reduced CBT sessions
2015: Mild back pain, diagnosed with early degenerative disc disease
  - Physical therapy and over-the-counter NSAIDs prescribed
2016: Hypertension worsened, started on lisinopril
2017: Routine colonoscopy showed benign polyps, removed during procedure
2018: Developed persistent cough, chest X-ray clear
  - Diagnosed with Gastroesophageal Reflux Disease (GERD)
  - Started on omeprazole
2019: Diagnosed with obstructive sleep apnea (OSA)
  - Started CPAP therapy, reported improved energy levels
2020: COVID-19 pandemic, worked from home
  - Reported increased anxiety, CBT sessions resumed (telehealth)
  - COVID-19 vaccination (Moderna, both doses)
2021: Mild knee pain, MRI showed minor meniscus tear
  - Arthroscopic surgery recommended, patient opted for conservative management
2022: Annual check-up showed pre-diabetes (A1C: 6.1%)
  - Intensified lifestyle modifications, referred to nutritionist
- Discontinued omeprazole due to resolved GERD symptoms
2023: Blood tests showed elevated PSA (Prostate-Specific Antigen)
  - Prostate biopsy performed, results negative for cancer
- Knee pain worsened, agreed to arthroscopic surgery
2024: Post-op knee recovery: good, continuing physical therapy
  - A1C levels improved (5.8%), pre-diabetes resolved
  - Stress test normal, but mild LVH on echocardiogram
  - Started on low-dose ACE inhibitor for cardioprotection
</patient_record>


<summary>
Name: Ethan Blackwood
Age: 55

Key Diagnoses:
- Hypertension (2010)
- Depression (2012)
- Degenerative Disc Disease (2015)
- Gastroesophageal Reflux Disease (GERD) (2018)
- Obstructive Sleep Apnea (OSA) (2019)
- Pre-diabetes (2022)
- Meniscus Tear (2021)
- Left Ventricular Hypertrophy (LVH) (2024)

Medications:
- Sertraline (depression)
- Lisinopril (hypertension)
- Omeprazole (GERD) - discontinued in 2022
- Low-dose ACE inhibitor (cardioprotection - 2024)

Other Treatments:
- Cognitive Behavioral Therapy (CBT) (depression)
- Physical therapy (back pain, post-op knee recovery)
- CPAP therapy (OSA)
- Arthroscopic knee surgery (2023)

Recent Concerns:
- Worsening knee pain
- Elevated PSA (2023)
- Left ventricular hypertrophy on echocardiogram (2024)

Action Items:
- Follow up on post-op knee recovery and physical therapy
- Monitor PSA levels and prostate health
- Optimize blood pressure and hypertension management
- Assess need for further cardiac workup after LVH finding
</summary>
</example>

Now, please summarize the following patient record in the same format:

<patient_record>
{record}
</patient_record>
"""
```

### Recap of the prompt changes
Before we try out our new prompt, let's take a look at the changes we made: 

* We added a clear system prompt to set the context and give Claude a clear role.
* We structured the input data using XML tags, `<patient_record>` in our case, to make it clear what part of the prompt is the input data.
* We provided clear, specific instructions on what the summary should focus on, such as diagnoses, medications, and recent health concerns.
* We specified the desired format for the summary.
* We added in an example input and corresponding well-formatted summary to guide Claude's reply.
* We asked Claude to generate the summary inside of `<summary>` tags.

---

## Testing out the new prompt
Let's try using our new `system` and `updated_prompt` prompts with the same 5 medical records in our `patient_records` list:

```python
def generate_summary_with_improved_prompt(patient_record):
    prompt_with_record = updated_prompt.format(record=patient_record) #use our rewritten prompt!
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4096,
        system=system, #add in our system prompt!
        messages=[{"role": "user", "content": prompt_with_record}]
    )
    print("===============================")
    print(response.content[0].text)
```

```python
generate_summary_with_improved_prompt(patient_records[0])
```

```python
generate_summary_with_improved_prompt(patient_records[1])
```

```python
generate_summary_with_improved_prompt(patient_records[2])
```

```python
generate_summary_with_improved_prompt(patient_records[3])
```

```python
generate_summary_with_improved_prompt(patient_records[4])
```

It's working great! Each of the outputs follows the rules and format that we specified. 
Scroll back to the top to see the types of outputs Claude generated for us with our initial prompt and compare those to our new consistent outputs!

---

## Switching things up: JSON!

We might be perfectly happy to have Claude generate the text summaries that our current prompt results in, but often we want specific structured responses that are easier to programmatically digest.  The most common approach is to use JSON.  

**Note: The easiest way to 'force' a JSON response is through Claude's tool use functionality, [which we cover in a separate lesson in our tool-use course](https://github.com/anthropics/courses/blob/master/tool_use/03_structured_outputs.ipynb).  The point of this demonstration is to show the impact that changing a prompt can have.**

To adapt our current prompt so that it generates a JSON response, we need to make a few changes:
* Explicitly tell Claude we want a JSON result and specify what the JSON output should include.
* Update our example summary to be a JSON output.

```python
# Unchanged System Prompt
system = """
You are a highly experienced medical professional with a specialty in translating complex patient histories into concise, actionable summaries.
Your role is to analyze patient records, identify critical information, and present it in a clear, structured format that aids in diagnosis and treatment planning.
Your summaries are invaluable for busy healthcare providers who need quick insights into a patient's medical history before appointments.
"""

#Prompt updated to generate JSON
updated_json_prompt = """
I need your help summarizing patient medical records for our team of doctors.
We have a series of follow-up appointments tomorrow, and the doctors need quick, insightful summaries to prepare.

Please provide these summaries in JSON format with the following structure:
{
  "name": "Patient's full name",
  "age": patient's age as an integer,
  "key_diagnoses": [
    {
      "diagnosis": "Primary diagnosis",
      "year": year of diagnosis as an integer
    },
    ...
  ],
  "medications": [
    {
      "name": "Medication name",
      "purpose": "Brief description of what it's for"
    },
    ...
  ],
  "other_treatments": [
    {
      "treatment": "Treatment name",
      "purpose": "Brief description of what it's for"
    },
    ...
  ],
  "recent_concerns": [
    "Brief statement of recent health issue or concern"
  ],
  "action_items": [
    "Action item 1",
    "Action item 2",
    ...
  ]
}

Here's an example of how we'd like the summaries formatted:

<example>
<patient_record>
Patient Name: Ethan Blackwood
Age: 55
Medical Record:

2010: Annual check-up, mild hypertension noted
  - Started on lifestyle modifications (diet, exercise)
2012: Diagnosed with moderate depression following job loss
  - Started on sertraline and cognitive-behavioral therapy (CBT)
2014: New job, reported improved mood
  - Continued sertraline, reduced CBT sessions
2015: Mild back pain, diagnosed with early degenerative disc disease
  - Physical therapy and over-the-counter NSAIDs prescribed
2016: Hypertension worsened, started on lisinopril
2017: Routine colonoscopy showed benign polyps, removed during procedure
2018: Developed persistent cough, chest X-ray clear
  - Diagnosed with Gastroesophageal Reflux Disease (GERD)
  - Started on omeprazole
2019: Diagnosed with obstructive sleep apnea (OSA)
  - Started CPAP therapy, reported improved energy levels
2020: COVID-19 pandemic, worked from home
  - Reported increased anxiety, CBT sessions resumed (telehealth)
  - COVID-19 vaccination (Moderna, both doses)
2021: Mild knee pain, MRI showed minor meniscus tear
  - Arthroscopic surgery recommended, patient opted for conservative management
2022: Annual check-up showed pre-diabetes (A1C: 6.1%)
  - Intensified lifestyle modifications, referred to nutritionist
- Discontinued omeprazole due to resolved GERD symptoms
2023: Blood tests showed elevated PSA (Prostate-Specific Antigen)
  - Prostate biopsy performed, results negative for cancer
- Knee pain worsened, agreed to arthroscopic surgery
2024: Post-op knee recovery: good, continuing physical therapy
  - A1C levels improved (5.8%), pre-diabetes resolved
  - Stress test normal, but mild LVH on echocardiogram
  - Started on low-dose ACE inhibitor for cardioprotection
</patient_record>


<summary>
{
  "name": "Ethan Blackwood",
  "age": 55,
  "key_diagnoses": [
    {
      "diagnosis": "Hypertension",
      "year": 2010
    },
    {
      "diagnosis": "Depression",
      "year": 2012
    },
    {
      "diagnosis": "Degenerative Disc Disease",
      "year": 2015
    },
    {
      "diagnosis": "Gastroesophageal Reflux Disease (GERD)",
      "year": 2018
    },
    {
      "diagnosis": "Obstructive Sleep Apnea (OSA)",
      "year": 2019
    },
    {
      "diagnosis": "Pre-diabetes",
      "year": 2022
    },
    {
      "diagnosis": "Left Ventricular Hypertrophy (LVH)",
      "year": 2024
    }
  ],
  "medications": [
    {
      "name": "Lisinopril",
      "purpose": "Hypertension management"
    },
    {
      "name": "Sertraline",
      "purpose": "Depression"
    },
    {
      "name": "ACE inhibitor (low-dose)",
      "purpose": "Cardioprotection"
    }
  ],
  "other_treatments": [
    {
      "treatment": "Cognitive Behavioral Therapy (CBT)",
      "purpose": "Depression management"
    },
    {
      "treatment": "Physical therapy",
      "purpose": "Back pain and knee recovery"
    },
    {
      "treatment": "CPAP therapy",
      "purpose": "Obstructive Sleep Apnea"
    },
    {
      "treatment": "Arthroscopic knee surgery",
      "purpose": "Meniscus tear repair"
    }
  ],
  "recent_concerns": [
    "Worsening knee pain, addressed with surgery",
    "Elevated PSA (2023), biopsy negative",
    "Mild left ventricular hypertrophy (2024)"
  ],
  "action_items": [
    "Follow up on post-op knee recovery and PT progress",
    "Monitor PSA levels and prostate health",
    "Assess cardiac health post-LVH finding",
    "Review blood pressure management"
  ]
}
</summary>
</example>

Now, please summarize the following patient record in the same format.  Output your JSON sumary inside of <summary> tags
"""

#Broke this part into its own variable to make it easier to use the `format` method later
# (the JSON curly braces in the above prompt variable cause problems when using `format` )
medical_record_input_prompt = """
<patient_record>
{record}
</patient_record>
"""
```

Let's test it out using the following function:

```python
def generate_summary_with_json_prompt(patient_record):
    final_prompt_part = medical_record_input_prompt.format(record=patient_record) #add the medical record to the final prompt piece
    complete_prompt = updated_json_prompt + final_prompt_part
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4096,
        system=system, #add in our system prompt!
        messages=[{"role": "user", "content": complete_prompt}]
    )
    print(response.content[0].text)
```

```python
generate_summary_with_json_prompt(patient_records[0])
```

Great, we're getting the JSON we want! 
To demonstrate how easy our new JSON responses are to work with, let's write a function that generates patient summaries for a batch of patients and then outputs a list of all the "action items" that a given physician might need for a day of appointments:

```python
import re
import json

def generate_summary_with_json_prompt(patient_record):
    final_prompt_part = medical_record_input_prompt.format(record=patient_record) #add the medical record to the final prompt piece
    complete_prompt = updated_json_prompt + final_prompt_part
    response = client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=4096,
        system=system, #add in our system prompt!
        messages=[{"role": "user", "content": complete_prompt}]
    )
    return response.content[0].text

def extract_json_from_summary_tags(summary_string):
     # Use regular expressions to find content between <summary> tags
    match = re.search(r'<summary>\s*(.*?)\s*</summary>', summary_string, re.DOTALL)
    if not match:
        print("No <summary> tags found in the input string.")
        return

    # Extract the JSON string
    return  match.group(1)

def extract_action_items(model_response):
    summary = extract_json_from_summary_tags(model_response)
    try:
        # Parse the JSON string
        summary_data = json.loads(summary)

        # Extract and print action items
        action_items = summary_data.get('action_items', [])
        patient_name = summary_data.get('name', "")
        print(f"Action Items for {patient_name}:")
        for idx, item in enumerate(action_items, 1):
            print(f"{idx}. {item}")
    except json.JSONDecodeError:
        print("Failed to parse JSON. Make sure the content between <summary> tags is valid JSON.")

def generate_daily_action_items(patient_records):
    # Takes a list of patient records, generates a summary for each, and prints the action items:
    for record in patient_records:
        summary = generate_summary_with_json_prompt(record)
        extract_action_items(summary)
```

```python
generate_daily_action_items(patient_records)
```