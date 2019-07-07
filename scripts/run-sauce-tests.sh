#!/usr/bin/env bash

##
# Copyright 2018 Google Inc. All Rights Reserved.
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
##

set -e
set -x

# Run the standard battery of tests for "modern" browsers:
npm run wct-sauce-modern

# Create legacy bundles:
npm run create-legacy-bundles

# Run an additional battery of tests against a special bundle targetting
# "legacy" browsers:
npm run wct-sauce-legacy

set +x
set +e