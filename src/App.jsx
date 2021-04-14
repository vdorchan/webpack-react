import React from 'react'
import Dog from './components/Dog'
import SvgBone from './assets/bone.svg'

import styles from './App.css'

const App = () => {
  return <div className={styles.helloWorld}>
    <p>Hello World!</p>
    <Dog />
    <SvgBone />
  </div>
}

export default App
