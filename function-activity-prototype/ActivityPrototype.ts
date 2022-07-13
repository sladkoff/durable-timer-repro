import {Context} from '@azure/functions';

export default function (context: Context) {
  context.log.info('Activity!!!');
  context.done();
}
