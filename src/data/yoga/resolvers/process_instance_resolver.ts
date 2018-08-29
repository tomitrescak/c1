import { getUserId, Mutation, purge, Query, Yoga } from '../utils';
import { FixtureContext } from './common';

export const query: Query = {
  bpmnProcessInstances(_parent, { input }, ctx, info) {
    throw new Error('Not Implemented');
    return ctx.db.query.bpmnProcesses(
      {
        where: purge<Yoga.BpmnProcessWhereInput>({ name_contains: 'we', status: input.status }),
        skip: input.skip,
        first: input.first
      },
      info
    );
  }
};

export const mutation: Mutation = {
  async createProcessInstance(_parent, { input: { processId } }, ctx, info) {
    const userId = getUserId(ctx);

    const processInstance = await ctx.db.mutation.createBpmnProcessInstance({
      data: {
        dateStarted: new Date(),
        duration: 0,
        ownerId: userId,
        process: {
          connect: {
            id: processId
          }
        },
        status: 'Running'
      }
    });

    await ctx.db.mutation.updateUser(
      {
        where: { id: userId },
        data: {
          processes: {
            connect: {
              id: processInstance.id
            }
          }
        }
      },
      info
    );

    return processInstance;
  }
};

export async function fixtures(
  ctx: ServerContext,
  fixtureContext: FixtureContext
): Promise<Yoga.BpmnProcessInstance[]> {
  // tslint:disable-next-line:no-console
  console.log('Fixtures process instances');

  const processes: Yoga.CreateProcessInstanceInput[] = [
    { processId: fixtureContext.processes[0].id },
    { processId: fixtureContext.processes[0].id }
    // { processId: fixtureContext.processes[1].id }
  ];

  let inserted: Yoga.BpmnProcessInstance[] = [];
  for (let input of processes) {
    const process = await mutation.createProcessInstance(null, { input }, ctx);
    inserted.push(process);
  }
  fixtureContext.processInstances = inserted;
  return inserted;
}
