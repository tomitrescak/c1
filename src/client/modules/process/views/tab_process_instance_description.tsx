import * as React from 'react';

import { Button, Comment, Feed, Form, Header, Icon, Message } from 'semantic-ui-react';

import { AvatarView } from 'client/modules/avatar/avatar_view';
import { QueryTypes } from 'data/client';
import { processTypeToIcon } from './process_icon';
import { ProcessInstanceStatus } from './process_instance_status';
import { TabContent } from './process_styles';

type Props = {
  process: QueryTypes.BpmnProcessDefinition;
  context: App.Context;
  processInstance: QueryTypes.BpmnProcessInstance;
};

export const TabProcessInstanceDescription: React.SFC<Props> = ({
  context,
  process,
  processInstance
}) => (
  <TabContent>
    <Header as="h2">
      <Icon name={processTypeToIcon(process.type)} />
      <Header.Content>
        {process.name}
        <Header.Subheader>
          <ProcessInstanceStatus context={context} status={processInstance.status} /> &middot;
          Manage your process &middot; {process.type}
        </Header.Subheader>
      </Header.Content>
    </Header>

    <Message positive>
      <Message.Header>
        <Icon name="hand point right" /> Your action is required!
      </Message.Header>

      <ul className="list">
        <li className="content">
          <a href="#">Something</a>
        </li>
      </ul>
    </Message>

    <Header as="h5" content={context.i18n`Activity`} icon="tasks" dividing />

    <Feed>
      <Feed.Event
        icon="pencil"
        date="Today"
        summary="You posted on your friend Stevie Feliciano's wall."
      />

      <Feed.Event>
        <Feed.Label icon="pencil" />
        <Feed.Content>
          <Feed.Date>Today</Feed.Date>
          <Feed.Summary>You posted on your friend Stevie Feliciano's wall.</Feed.Summary>
        </Feed.Content>
      </Feed.Event>
    </Feed>

    <Header as="h5" content={context.i18n`Comments`} icon="comment" dividing />

    <Comment.Group>
      <Comment>
        <AvatarView />
        <Comment.Content>
          <Comment.Author as="a">Matt</Comment.Author>
          <Comment.Metadata>
            <div>Today at 5:42PM</div>
          </Comment.Metadata>
          <Comment.Text>How artistic!</Comment.Text>
        </Comment.Content>
      </Comment>

      <Comment>
        <AvatarView />
        <Comment.Content>
          <Comment.Author as="a">Elliot Fu</Comment.Author>
          <Comment.Metadata>
            <div>Yesterday at 12:30AM</div>
          </Comment.Metadata>
          <Comment.Text>
            <p>This has been very useful for my research. Thanks as well!</p>
          </Comment.Text>
        </Comment.Content>
      </Comment>

      <Comment>
        <AvatarView />
        <Comment.Content>
          <Comment.Author as="a">Joe Henderson</Comment.Author>
          <Comment.Metadata>
            <div>5 days ago</div>
          </Comment.Metadata>
          <Comment.Text>Dude, this is awesome. Thanks so much</Comment.Text>
        </Comment.Content>
      </Comment>

      <Form reply>
        <Form.TextArea autoHeight={true} />
        <Button content="Add Reply" labelPosition="left" icon="edit" primary />
      </Form>
    </Comment.Group>
  </TabContent>
);
