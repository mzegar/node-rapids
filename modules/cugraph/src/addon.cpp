// Copyright (c) 2020-2021, NVIDIA CORPORATION.
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

#include "node_cugraph/graph_coo.hpp"

#include <nv_node/addon.hpp>

struct node_cugraph : public nv::EnvLocalAddon, public Napi::Addon<node_cugraph> {
  node_cugraph(Napi::Env const& env, Napi::Object exports) : nv::EnvLocalAddon(env, exports) {
    DefineAddon(exports,
                {
                  InstanceMethod("init", &node_cugraph::InitAddon),
                  InstanceValue("_cpp_exports", _cpp_exports.Value()),

                  InstanceValue("GraphCOO", InitClass<nv::GraphCOO>(env, exports)),
                });
  }
};

NODE_API_ADDON(node_cugraph);
