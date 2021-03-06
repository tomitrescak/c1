import { Prisma } from 'data/prisma';
import { Yoga } from 'data/yoga';
import { Lane } from './bpmn/bpmn_lane_model';
import { BpmnProcessModel, BpmnTypes } from './bpmn_process_model';

export type ProcessActionResult = {
  /**
   * List of active task instances (BpmnTaskInstance.task.id)
   */
  active: string[];
  /**
   * List of ids of executed base elements
   */
  executed: string[];
  processInstance: BpmnProcessInstance;
};

export class BpmnProcessInstance {
  static async duplicateInstance(_processInstanceDAO: Prisma.BpmnProcessInstance) {
    throw new Error('not implmented');
    // retrieve and build process model
    // const processModel = new BpmnProcessModel(processInstanceDAO.process);

    // copy process instance DAO
    // const newProcessInstanceDAO;

    // build new instance
    // return new BpmnProcessInstance(newProcessInstanceDAO, processModel);
  }

  static async createInstance(
    processId: string,
    processModel: BpmnProcessModel,
    context: ServerContext
  ): Promise<BpmnProcessInstance> {
    // create new process instance dao using context.db
    // create object with dao and given process model
    const processInstanceDAO = await context.db.mutation.createBpmnProcessInstance(
      {
        data: {
          // dateFinished: null,
          dateStarted: new Date(),
          // duration: null,
          owner: {
            connect: {
              id: context.userId
            }
          },
          data: {},
          status: 'Running',
          process: {
            connect: {
              id: processId
            }
          }
        }
      },
      `{
      id
      dateStarted
      owner
      status
      process {
        id
        access
        actionCount
        dataDescriptors
        description
        model
        name
        type
        resources
        status
        version
        versions
      }
    } `
    );
    
    const processInstance = new BpmnProcessInstance(processInstanceDAO, processModel);
    return processInstance;
  }
  
  static async setStatus(ctx: ServerContext, { processInstanceId, status }: Yoga.SetProcessInstanceStatusInput, info: any) {
    const process = await ctx.db.mutation.updateBpmnProcessInstance({
      where: {
        id: processInstanceId
      },
      data: {
        status
      }
    }, info);

    // update all taskInstances of this process
    const taskInstances = await ctx.db.query.bpmnTaskInstances({
      where: {
        processInstance: {
          id: processInstanceId
        }
      }
    });

    if (taskInstances) {
      let newTaskInstanceStatus: Prisma.BpmnTaskInstanceStatus;

      switch (status) {
        case 'Running':
          newTaskInstanceStatus = 'Waiting';
          break;
        case 'Paused':
          newTaskInstanceStatus = 'Paused';
          break;
        case 'Aborted':
          newTaskInstanceStatus = 'Aborted';
          break;
        case 'Finished':
          newTaskInstanceStatus = 'Finished';
          break;
      }

      taskInstances.forEach(async (taskInstance: Prisma.BpmnTaskInstance) => {
        await ctx.db.mutation.updateBpmnTaskInstance({
          where: {
            id: taskInstance.id
          },
          data: {
            status: newTaskInstanceStatus
          }
        });
      });
    }

    return process;
  }

  id: string;
  processId: string;
  processModel: BpmnProcessModel;
  resources: any; // JSON
  data: any;  // JSON 
  ownerId: string;
  status: Prisma.BpmnProcessInstanceStatus;
  dateStarted: Date;
  dateFinished: Date;
  duration: number;

  constructor(instanceModelDao: Partial<Prisma.BpmnProcessInstance>, processModel: BpmnProcessModel) 
  {

    this.id = instanceModelDao.id;
    // this.processId = instanceModelDao.processId;
    this.processModel = processModel;
    // this.resources = JSON.parse(instanceModelDao.resources);
    this.ownerId = instanceModelDao.owner.id;
    this.status = instanceModelDao.status;
    this.dateStarted = new Date(instanceModelDao.dateStarted);
    this.dateFinished = new Date(instanceModelDao.dateFinished);
    this.duration = instanceModelDao.duration;

    processModel ? (this.processModel = processModel) : null;
  }

  async start(context: ServerContext, role: string): Promise<ProcessActionResult> {
    /* 
      set status to running
      execute each lane?
    */
    await context.db.mutation.updateBpmnProcessInstance({
      data: {
        status: 'Running'
      },
      where: {
        id: this.id
      }
    });

    const result: ProcessActionResult = {
      active: [],
      executed: [],
      processInstance: this
    };

    this.processModel
      .getElementList<Lane>(BpmnTypes.Lane)
      .find(l => l.roles.some(r => r === role))
      .execute(this, context, result);

    return result;
  }

  async pause(context: ServerContext) {
    /* 
      set status to paused 
      need to control relevant task instances and sub processes?
    */
    await context.db.mutation.updateBpmnProcessInstance({
      data: {
        status: 'Paused'
      },
      where: {
        id: this.id
      }
    });
  }

  async abort(context: ServerContext) {
    /* set status to aborted */
    await context.db.mutation.updateBpmnProcessInstance({
      data: {
        status: 'Aborted'
      },
      where: {
        id: this.id
      }
    });
  }

  async finish(context: ServerContext) {
    /* 
      set status to finished 
      set dateFinished
      set duration
      ...anything else?
      */

    await context.db.mutation.updateBpmnProcessInstance({
      data: {
        status: 'Finished'
      },
      where: {
        id: this.id
      }
    });
  }
}
