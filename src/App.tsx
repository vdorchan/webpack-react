import React from 'react'
import Dog from './components/Dog'
import SvgBone from './assets/bone.svg'
import Button from './components/Button'

import styles from './App.css'

const App = () => {
  const [count, setCount] = React.useState(0)

  const onClick = () => {
    setCount(count + 1)
  }

  return (
    <div className={styles.helloWorld}>
      <h1>Hello World</h1>
      <div>
        <Button onClick={onClick} text="Add" />
        <span> count: {count}</span>
      </div>
      <Dog />
      <SvgBone />
    </div>
  )
}

export default App
