import {orchestrator} from 'durable-functions';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {IOrchestrationFunctionContext} from 'durable-functions/lib/src/iorchestrationfunctioncontext';
import CronParser from 'cron-parser';

dayjs.extend(utc);

export default orchestrator(function* (context: IOrchestrationFunctionContext) {
  const cronExpression = context.df.getInput<string>();

  // TODO MS documentation suggests that 'eternal orchestrations' should trigger themselves using `continueAsNew`
  // We can't do that because it resets the instance history which we need to display to the users
  // Instead we use this while(true) loop...
  let executionPending = true;
  while (executionPending) {
    const interval = CronParser.parseExpression(cronExpression, {
      utc: true,
      currentDate: dayjs.utc(context.df.currentUtcDateTime).toDate(),
    });

    if (interval.hasNext()) {
      const nextRun = interval.next(); // min(interval.next(), now + 7d);

      context.df.isReplaying ||
        context.log(
          `next run: ${nextRun.toDate()} (${interval.stringify(true)})`
        );
      // FIXME Timers can not be scheduled further than 7 days!!!!!!!!!
      const scheduled = true; // nextRun <= 7
      try {
        yield context.df.createTimer(nextRun.toDate());
      } catch (e) {
        context.df.isReplaying || context.log.error('Timer creation failed', e);
      }

      if (scheduled) {
        // Execute cron task
        try {
          context.df.isReplaying ||
            context.log(`Orchestrate activity! (${context.df.instanceId})`);
          yield context.df.callActivity('activity-prototype');
        } catch (e) {
          context.df.isReplaying ||
            context.log.error(
              'Activity failed, this will be recorded to history',
              e
            );
        }
      }
    } else {
      // abort
      executionPending = false;
    }
  }
});
