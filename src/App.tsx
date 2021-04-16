import React from 'react'
import Dog from './components/Dog'
import SvgBone from './assets/bone.svg'
import Button from './components/Button'
import BasicLayout from './BasicLayout'

import styles from './App.css'

const App = () => {
  const [count, setCount] = React.useState(0)

  const onClick = () => {
    setCount(count + 1)
  }

  return (
    <BasicLayout>
      <h1 className={styles.helloWorld}>Hello World</h1>
      <div>
        <Button onClick={onClick} text="Add" />
        <span> count: {count}</span>
      </div>
      <Dog />
      <SvgBone />
    </BasicLayout>
  )
}

export default App
