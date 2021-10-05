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

import { SlideMenu } from '../slide-menu/slide-menu';
import { Container } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { slide as Menu } from 'react-burger-menu';
import styles from './navbar.module.css';
import Navbar from 'react-bootstrap/Navbar';

export default function CustomNavbar({ title }) {
    return (
        <Navbar bg="dark" variant="dark" className={styles.navbar}>
            <Navbar.Brand>
                <div className={styles.title}>
                    {title}
                </div>
            </Navbar.Brand>
        </Navbar >
    )
}
