import * as React from 'react';

import { QueryTypes } from 'data/client';

import { Link } from '@reach/router';
import { Button, List } from 'semantic-ui-react';
import { ProcessIcon } from './process_icon';

type Props = {
  process: QueryTypes.ProcessesQuery_Processes;
};

export const ProcessListItemView: React.SFC<Props> = ({ process }) => (
  <List.Item>
    <List.Content floated="right">
      <Button primary icon="rocket" content="Launch" />
    </List.Content>
    <ProcessIcon type={process.type} />
    <List.Content verticalAlign="top">
      <List.Header as={Link} to="nowhere">
        {process.name}
      </List.Header>
      <List.Description>{process.description}</List.Description>
    </List.Content>
  </List.Item>
);

ProcessListItemView.displayName = 'ProcessListItemView';
