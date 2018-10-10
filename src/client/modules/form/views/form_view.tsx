import * as React from 'react';

import { Form, SemanticWIDTHSNUMBER } from 'semantic-ui-react';

import { groupByArray } from 'data/helpers';

import { renderControl } from '../models/form_control_factory';
import { DataSet, FormElement } from '../models/form_model';

interface IFieldOwner {
  elements?: FormElement[];
}

interface Props {
  owner: DataSet;
  formControl: IFieldOwner;
  handlers?: { [index: string]: () => void };
}

export class FormView extends React.Component<Props> {
  lastRow = -1;
  lastColumn = -1;

  renderColumn(control: FormElement) {
    if (control.row !== this.lastRow) {
      this.lastRow = control.row;
      this.lastColumn = 0;
    }
    // we initialise all columns and add missing ones in between
    let columns = [];
    const formControl = control;

    if (formControl.control === 'DeleteButton') {
      formControl.label = '\xA0';
    }

    // insert missing start column
    if (control.column > this.lastColumn) {
      columns.push(
        <Form.Field
          key={this.lastColumn}
          width={(control.column - this.lastColumn) as SemanticWIDTHSNUMBER}
        >
          &nbsp;
        </Form.Field>
      );
    }

    columns.push(
      <Form.Field
        key={control.column}
        width={formControl.inline ? undefined : (control.width as SemanticWIDTHSNUMBER)}
        inline={formControl.inline}
      >
        {formControl.label &&
          formControl.control !== 'Checkbox' &&
          formControl.label !== 'Radio' && (
            <label htmlFor={(formControl.source && formControl.source.name) || undefined}>
              {formControl.label}
            </label>
          )}
        {renderControl(control, this.props.owner, this.props.handlers)}
      </Form.Field>
    );

    this.lastColumn = control.column + control.width;
    return columns;
  }

  render() {
    this.lastColumn = 0;
    this.lastRow = 0;

    const rows = groupByArray(this.props.formControl.elements, 'row');

    return (
      <div className="ui form" style={{ maxWidth: '1000px' }}>
        {rows.map(row => (
          <Form.Group key={row.key}>
            {row.values.map(element => this.renderColumn(element))}
          </Form.Group>
        ))}
      </div>
    );
  }
}
