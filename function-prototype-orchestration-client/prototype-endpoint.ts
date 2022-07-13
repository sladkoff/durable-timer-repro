import {Context, HttpRequest} from '@azure/functions';

import {getClient} from 'durable-functions';
import {DurableOrchestrationClient} from 'durable-functions/lib/src/durableorchestrationclient';

type HttpResponse<T> = {
  readonly status: number;
  readonly body?: T;
}


export const cronJobApi = async function (
  context: Context
): Promise<HttpResponse<any>> {
  try {
    const method = context.req?.method ?? 'GET';

    switch (method) {
      case 'GET':
        return getInstance(context);
      case 'POST':
        return startInstance(context);
      case 'DELETE':
        return deleteInstance(context);
      default:
        return badRequestResponse('request method not supported');
    }
  } catch (error) {
    return serverErrorResponse();
  }
};

async function startInstance(
  context: Context
): Promise<HttpResponse<any>> {
  const client = getClient(context);
  const cronParam = getQueryParam(context.req!, 'cron', '*/30 * * * * *');

  const instanceId = await client.startNew(
    'orchestrator-prototype',
    undefined,
    cronParam
  );

  return okResponse(instanceId);
}

async function getInstance(
  context: Context
): Promise<HttpResponse<any>> {
  const client = getClient(context);
  const instanceIdParam = getQueryParam(context.req!, 'instanceId', undefined);

  const response = await client.getStatus(instanceIdParam, true, true, true);

  return okResponse(response);
}

async function deleteInstance(
  context: Context
): Promise<HttpResponse<any>> {
  const client = getClient(context);
  const instanceIdParam = getQueryParam(context.req!, 'instanceId', undefined);

  const response = await client.terminate(
    instanceIdParam,
    'terminated by user via API'
  );

  return okResponse(response);
}

const getQueryParam = (
  request: HttpRequest,
  queryParam: string,
  defaultValue: string | undefined
): string => {
  const value = request.query[queryParam];

  if (defaultValue === undefined) {
    if (!value) {
      throw new Error(`Missing Query Parameter: ${queryParam}`);
    }
  } else {
    if (!value) {
      return defaultValue;
    }
  }

  return value;
};

const httpResponse = <T>(status: number, body?: T): HttpResponse<T> => {
  return {
    status: status,
    body: body,
  };
};

const badRequestResponse = (error: string): HttpResponse<any> => {
  return {
    status: 400,
    body: error,
  };
};

const okResponse = <T>(entity: T): any => {
  return {
    status: 200,
    body: entity,
    headers: {
      'Content-Type': 'application/json',
    },
  };
};

const serverErrorResponse = (message = 'Internal server error') => {
  return {
    status: 500,
    body: message,
  };
};


const noContentResponse: HttpResponse<any> = {status: 204};
