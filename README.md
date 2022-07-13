# Reproduction repo

## Environment information

```
node --version
v16.15.0

npm --version
8.12.2

func --version
4.0.4590
```

## Run

```bash
nvm use
npm i
npm run build && npm run start:host 
```

## Available HTTP endpoints

```bash
# Orchestrate a dummy activity in the future
http POST :7071/api/prototype/orchestrate cron=="0 24 10 19 07 *"

# Read orchestration status (with history)
http GET :7071/api/prototype/orchestrate instanceId=="instance-id-from-previous-command"

# Stop orchestration 
http DELETE :7071/api/prototype/orchestrate instanceId=="instance-id-from-previous-command"
```

## Reproduction steps

### Good case

```bash
# get current time
date
Wed Jul 13 01:35:10 PM CEST 2022

# create cron expression "now plus 6d" (utc)
CRON="0 35 11 19 07 *"
http POST :7071/api/prototype/orchestrate cron==$CRON

# Note the output of the orchestrator function:
# next run: Tue Jul 19 2022 13:35:00 GMT+0200 (Central European Summer Time) (0 35 11 19 7 *)

# Get orchestration history
http :7071/api/prototype/orchestrate instanceId=="guid-from-previous-command"
```

A `TimerCreated` event exists in the output:

```json
"historyEvents": [
        {
            "Correlation": null,
            "EventType": "ExecutionStarted",
            "FunctionName": "orchestrator-prototype",
            "ScheduledStartTime": null,
            "Timestamp": "2022-07-13T11:38:20.9919104Z"
        },
        {
            "EventType": "TimerCreated",
            "FireAt": "2022-07-19T11:35:00Z",
            "Timestamp": "2022-07-13T11:38:21.1223812Z"
        }
    ],
```

### Bad case


```bash
# get current time
date
Wed Jul 13 01:35:10 PM CEST 2022

# create cron expression "now plus 6d + 1m" (utc)
CRON="0 36 11 19 07 *"
http POST :7071/api/prototype/orchestrate cron==$CRON

# Note the output of the orchestrator function:
# next run: Tue Jul 19 2022 13:36:00 GMT+0200 (Central European Summer Time) (0 36 11 19 7 *)

# Get orchestration history
http :7071/api/prototype/orchestrate instanceId=="guid-from-previous-command"
```

A `TimerCreated` event does not exist in the output:

```json
"historyEvents": [
        {
            "Correlation": null,
            "EventType": "ExecutionStarted",
            "FunctionName": "orchestrator-prototype",
            "ScheduledStartTime": null,
            "Timestamp": "2022-07-13T11:38:20.9919104Z"
        }
    ],
```
