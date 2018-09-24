import * as React from 'react';

import { mock, MockedProvider, render } from 'client/tests';

import { ProcessListContainer } from '../process_instance_list_container';
import { PROCESS_INSTANCE_LIST_QUERY } from '../process_queries';
import { createProcessInstanceList } from './process_test_data';

describe('Process', () => {
  describe('Instances', () => {
    describe('List', () => {
      describe('Container', () => {
        beforeEach(() => mock.reset());

        function componentWithData() {
          return (
            <MockedProvider>
              <div>
                <ProcessListContainer
                  icon="tasks"
                  header="Process List"
                  description="Process list description"
                />
              </div>
            </MockedProvider>
          );
        }

        function luisComponent() {
          mock.reset();
          mock.expect(PROCESS_INSTANCE_LIST_QUERY).reply({
            bpmnProcessInstances: createProcessInstanceList()
          });

          return componentWithData();
        }

        it('renders loading', () => {
          mock.expect(PROCESS_INSTANCE_LIST_QUERY).loading();
          const root = render(componentWithData());
          expect(root).toMatchSnapshot();
        });

        it('renders error', () => {
          mock.expect(PROCESS_INSTANCE_LIST_QUERY).fail('This is some error');
          const root = render(componentWithData());
          expect(root).toMatchSnapshot();
        });

        it('renders data', async () => {
          mock.expect(PROCESS_INSTANCE_LIST_QUERY).reply({
            bpmnProcessInstances: createProcessInstanceList()
          });

          const root = render(componentWithData());
          expect(root).toMatchSnapshot();
        });

        return {
          component: luisComponent()
        };
      });
    });
  });
});
