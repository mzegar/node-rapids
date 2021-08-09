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

process.on('message', (args) => { console.log(args); });

// const { BlazingContext, UcpContext, ContextProp } = require('@rapidsai/blazingsql');

// // TODO: Centralize and import these
// const CREATE_BLAZING_CONTEXT = 'createBlazingContext';
// const configOptions = {
//   PROTOCOL: 'UCX',
// };
// // TODO:

// const ucpContext = new UcpContext();
// console.log(`Creating context:${ucpContext}`);
// let bc = null;

// process.on('message', (args) => {
//   const { operation, ...rest } = args;
//   const { ctxToken, dataframe, messageId, query, tableName, ucpMetadata } = rest;

//   if (operation == CREATE_BLAZING_CONTEXT) {
//     console.log("New Context created\n");
//     bc = new BlazingContext({
//       ralId: process.pid,
//       ralCommunicationPort: 4000 + process.pid,
//       configOptions: { ...configOptions },
//       workersUcpInfo: ucpMetadata.map((xs) => ({ ...xs, ucpContext })),
//     });
//   }
// });
