import { Prisma } from 'data/prisma';
import { Task } from './bpmn';

export class BpmnTaskInstanceModel {
  id: string;
  task: Task;
  processInstanceId: string;
  performerId: string;
  performerRoles: string[];
  dateStarted: Date;
  dateFinished: Date;
  duration: number;
  snapshot: any;

  constructor(taskInstanceModelDao: Partial<Prisma.BpmnTaskInstance>, task?: Task) {
    this.id = taskInstanceModelDao.id;
    this.task = task ? task : null;
    this.processInstanceId = taskInstanceModelDao.processInstance.id;
    this.performerId = taskInstanceModelDao.performerId;
    this.performerRoles = taskInstanceModelDao.performerRoles;
    this.dateStarted = new Date(taskInstanceModelDao.dateStarted);
    this.dateFinished = new Date(taskInstanceModelDao.dateFinished);
    this.duration = taskInstanceModelDao.duration;
    this.snapshot = taskInstanceModelDao.snapshot;
  }

  execute() {
    /*
      finish task
      update DAO
        performerId
        dateFinished
        duration
        snapshot
    */
  }

  validation() { /**/ }
}