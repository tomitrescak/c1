import * as React from 'react';

import { observer } from 'mobx-react';
import { Dropdown } from 'semantic-ui-react';

import { DataSet, FormElement } from '../models/form_model';
import { ErrorView } from './error_view';

type Props = {
  formControl: FormElement;
  owner: DataSet;
};

@observer
export class SelectView extends React.Component<Props> {
  handleSelectChange = (_e: React.ChangeEvent<HTMLInputElement>, control: HTMLSelectElement) => {
    // find value
    this.props.owner.setStringValue(this.props.formControl.source.name, control.value);
  };

  render() {
    const { formControl, owner } = this.props;
    const { source, controlProps, list, filterSource, filterColumn } = formControl;

    return (
      <>
        <Dropdown
          {...controlProps}
          options={
            filterSource
              ? owner
                  .getList(list)
                  .filter((v: any) => v[filterColumn] === owner.getValue(filterSource))
              : owner.getList(list)
          }
          name={source.name}
          selection={true}
          value={owner.getStringValue(source.name)}
          onChange={this.handleSelectChange}
        />

        <ErrorView owner={owner} source={source.name} />
      </>
    );
  }
}
