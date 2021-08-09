// Copyright (c) 2021, NVIDIA CORPORATION.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {UcpContext} from '../addon';
import {BlazingContext} from '../blazingcontext';
import {CONFIG_OPTIONS, CREATE_BLAZING_CONTEXT} from './blazingcluster';

const ucpContext = new UcpContext();

process.on('message', (args: Record<string, unknown>) => {
  const {operation, ...rest} = args;

  if (operation == CREATE_BLAZING_CONTEXT) {
    const ucpMetaData: Record<string, any> = rest['ucpMetadata'] as Record<string, any>;

    console.log(`worker: ${1}`);
    console.log(ucpMetaData);
    console.log(CONFIG_OPTIONS);
    console.log(ucpMetaData.map((xs: any) => ({...xs, ucpContext})));

    const bc = new BlazingContext({
      ralId: 1,
      ralCommunicationPort: 9000 + 1,
      configOptions: {...CONFIG_OPTIONS},
      workersUcpInfo: ucpMetaData.map((xs: any) => ({...xs, ucpContext}))
    });

    console.log(bc);
  }
});

// worker: 1
// [
//   { workerId: '0', ip: '0.0.0.0', port: 4000 },
//   { workerId: '1', ip: '0.0.0.0', port: 4001 }
// ]
// { PROTOCOL: 'UCX' }

// worker: 1
// [
//   { workerId: '0', ip: '0.0.0.0', port: 4000 },
//   { workerId: '1', ip: '0.0.0.0', port: 4001 }
// ]
// { PROTOCOL: 'UCX' }
