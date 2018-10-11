// import * as shortid from 'shortid';

import * as validations from './validation';

import { ISimpleType, types } from 'mobx-state-tree';
import { UndoManager } from 'mst-middlewares';

import { QueryTypes } from 'data/client';
import { DataDescriptor, Form, FormElement } from './form_model';
import { FormStore, IFormStore } from './form_store';
import { FormValidation } from './form_validation_model';
import { random } from './random';

export type FormElement = QueryTypes.FormElement & { elements: FormElement[] };
export type DataDescriptor = QueryTypes.DataDescriptor; // & { descriptors: DataDescriptor[] };
export type Form = QueryTypes.Form; // & { elements: FormElement[] };

export type DataSet = typeof FormStore.Type;

export type FormControlProps = {
  formControl: FormElement;
  owner: IFormStore;
};

function formItemSort(a: FormElement, b: FormElement) {
  return a.row < b.row
    ? -1
    : a.row > b.row
      ? 1
      : a.column < b.column
        ? -1
        : a.column > b.column
          ? 1
          : 0;
}

function mstTypeFactory(
  desc: DataDescriptor,
  defaultObject: any,
  lists: Array<{ name: string; items: any[] }>,
  all: DataDescriptor[]
): ISimpleType<any> {
  switch (desc.type) {
    case 'String':
      return types.string;
    case 'Int':
      return types.number;
    case 'Float':
      return types.number;
    case 'Boolean':
      return types.boolean;
    case 'Object':
      const children = all.filter(d => d.parentDescriptor === desc.id);
      return FormModel.buildMst(desc.id, defaultObject, children, lists);
    // return For
    case undefined:
      return types.string;
  }
  throw new Error('MST Type not supported: ' + desc.type);
}

let time = Date.now();
let i = 0;

export function safeEval(t: any, expression: string, value: any = null) {
  const f = new Function(
    'value',
    'eval',
    'global',
    'window',
    'document',
    'setTimeout',
    'setInterval',
    'Object',
    // 'console',
    'XMLHttpRequest',
    'Function',
    expression.indexOf(';') > 0 ? expression : 'return ' + expression
  );
  return f.call(t, value);
}

function createValidator(validator: QueryTypes.DataDescriptor_Validators) {
  switch (validator.name) {
    case 'RegExValidator':
      return validations.RegExValidator(new RegExp(validator.params[0]), validator.params[1]);
    case 'ExpressionValidator':
      // @ts-ignore
      return function(value) {
        if (!safeEval('_', validator.params[0], value)) {
          return validator.params[1] || 'Unexpected value';
        }
      };

    default:
      const v = (validations as any)[validator.name];
      if (!v) {
        throw new Error('Validator does not exist!: ' + validator.name);
      }
      return (value: any) => (validations as any)[validator.name](value, validator.params[0]);
  }
}

/* =========================================================
    Undo Manager
   ======================================================== */

export let undoManager = {
  manager: null as typeof UndoManager.Type,
  undo: () => {
    undoManager.manager.canUndo && undoManager.manager.undo();
  },
  redo: () => {
    undoManager.manager.canRedo && undoManager.manager.redo();
  }
};
export const setUndoManager = (targetStore: any) => {
  undoManager.manager = targetStore.history;
  return {};
};

/* =========================================================
    Form Model
   ======================================================== */

function shortId() {
  return (time + i++).toString();
}

export class FormModel {
  static parseDefault(descriptor: DataDescriptor) {
    switch (descriptor.type) {
      case 'Int':
        return parseInt(descriptor.defaultValue || '0', 10) as any;
      case 'Float':
        return parseFloat(descriptor.defaultValue || '0') as any;
      case 'Boolean':
        return (descriptor.defaultValue === 'true' || descriptor.defaultValue === 'True') as any;
      case 'Date':
        return new Date(descriptor.defaultValue);
    }
    return descriptor.defaultValue;
  }

  static initStrings(data: any, parent?: any, parentKey?: string) {
    if (data && data.strings) {
      return data;
    }

    // arrays

    if (data && Array.isArray(data)) {
      for (let m of data) {
        FormModel.initStrings(m);
      }
    }

    // objects
    else if (data && typeof data === 'object') {
      data.strings = {};

      for (let key of Object.getOwnPropertyNames(data)) {
        if (key === 'strings') {
          continue;
        }

        let item = data[key];
        FormModel.initStrings(item, data, key);
      }
    }

    // scalars
    else if (parent) {
      parent.strings[parentKey] = data != null ? data.toString() : '';
      return data;
    }

    return data;
  }

  static buildMst(
    parentDescriptorId: string,
    defaultValue: any,
    descriptors: DataDescriptor[],
    lists?: Array<{ name: string; items: any[] }>
  ) {
    const descriptorMap: {
      [index: string]: DataDescriptor;
    } = {};
    for (let d of descriptors) {
      descriptorMap[d.name] = d;
    }

    // prepare model and views

    const mstDefinition: { [index: string]: any } = {};
    const validators: { [index: string]: any } = {};

    const viewDefinition = () => {
      const view = {};

      /* =========================================================
          EXPRESSIONS
         ======================================================== */

      for (let desc of descriptors.filter(d => d.parentDescriptor === parentDescriptorId)) {
        // expressions do not need state tree entry they are evaluated automatically
        if (desc.expression) {
          (view as any).__defineGetter__(desc.name, function() {
            // @ts-ignore
            return safeEval(this, desc.expression);
          });
        }
      }

      if (lists) {
        for (let list of lists) {
          (view as any).__defineGetter__(list.name, function() {
            return list.items;
          });
        }
      }

      return view;
    };

    /* =========================================================
        MST Nodes
       ======================================================== */

    let arrays: string[] = [];
    let objects: string[] = [];

    // add mst nodes for non expression fields
    // expressions do not need custom nodes and are handled by views
    for (let desc of descriptors.filter(d => d.parentDescriptor === parentDescriptorId)) {
      // expressions do not need state tree entry they are evaluated automatically
      if (desc.isArray) {
        const obj = {};
        mstDefinition[desc.name] = types.array(
          types.optional(mstTypeFactory(desc, obj, lists, descriptors), () => {
            return obj;
          })
        );
        defaultValue[desc.name] = [];
        defaultValue[desc.name + '_default'] = obj;
        arrays.push(desc.name);
      } else if (desc.type === 'Id') {
        mstDefinition[desc.name] = types.optional(types.identifier, shortId); // shortid.generate());
      } else if (desc.type === 'Object') {
        const newParent = {};
        defaultValue[desc.name] = newParent;
        mstDefinition[desc.name] = mstTypeFactory(desc, newParent, lists, descriptors);
        objects.push(desc.name);
      } else if (!desc.expression) {
        defaultValue[desc.name] = desc.defaultValue == null ? undefined : desc.defaultValue;
        mstDefinition[desc.name] = desc.defaultValue
          ? FormModel.parseDefault(desc)
          : types.maybe(mstTypeFactory(desc, defaultValue, lists, descriptors));
      }

      /* =========================================================
          VALIDATORS
         ======================================================== */

      if (desc.validators && desc.validators.length) {
        validators[desc.name] = desc.validators.map(v => createValidator(v));
      }
      switch (desc.type) {
        case 'Int':
          if (!validators[desc.name]) {
            validators[desc.name] = [];
          }
          validators[desc.name].push(validations.IntValidator);
          break;
        case 'Float':
          if (!validators[desc.name]) {
            validators[desc.name] = [];
          }
          validators[desc.name].push(validations.FloatValidator);
          break;
      }
    }

    if (parentDescriptorId == null) {
      mstDefinition.history = types.optional(UndoManager, {});
    }

    // add strings to default data
    FormModel.initStrings(defaultValue);

    // build tree
    const mst = FormStore.named('FormStore')
      .props(mstDefinition)
      .volatile(_self => ({
        descriptors: descriptorMap,
        validators,
        arrays,
        objects,
        defaultValue
      }))
      .views(viewDefinition);

    return mst;
  }

  static randomValue(descriptor: DataDescriptor) {
    switch (descriptor.type) {
      case QueryTypes.DataType.String:
        return random.words(2);
      case QueryTypes.DataType.Boolean:
        return random.boolean();
      case QueryTypes.DataType.Id:
        return '1';
      case QueryTypes.DataType.Int:
        return random.int();
      case QueryTypes.DataType.Float:
        return random.float();
    }
    return undefined;
  }

  static buildMstModel(
    descriptors: DataDescriptor[],
    data: any,
    lists?: Array<{ name: string; items: any[] }>,
    _initRandomValues = false
  ): DataSet {
    // data initialisation
    // const data: any = {};
    // if (initRandomValues) {
    //   for (let descriptor of descriptors) {
    //     dataArray.push({ name: descriptor.name, value: FormModel.randomValue(descriptor) });
    //   }
    // }

    FormModel.initStrings(data);

    const mst = FormModel.buildMst(null, {}, descriptors, lists);
    const dataset = mst.create(data);

    setUndoManager(dataset);

    return dataset;
  }

  id: string;
  name: string;
  description: string;
  elements: FormElement[];
  validations: FormValidation[];

  constructor(form: Form) {
    this.id = form.id;
    this.name = form.name;
    this.description = form.description;
    this.validations = form.validations;

    // initialise elements
    this.elements = [];
    for (let p of form.elements) {
      if (!p.parentElement) {
        this.elements.push(p as FormElement);
        continue;
      }
      let parent = form.elements.find(f => f.id === p.parentElement) as FormElement;
      if (!parent) {
        throw new Error('Invalid data. Parent does not exist: ' + p.parentElement);
      }
      if (!parent.elements) {
        parent.elements = [];
      }
      parent.elements.push(p as FormElement);
    }

    this.elements.sort(formItemSort);
  }
}
