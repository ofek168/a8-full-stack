import styles from './IOptions.module.scss'
import Toggle from './Your_Courses/togglesched'
import Menu from './Menu/Menu'
import Canvas from './Canvas/Canvas'
import Link from 'next/link'
import CollectionsList from '@components/CreatorView/CollectionsView/CollectionsList'
import { sample, sample2 } from '@components/Samples'
import { ICollection, ICourse, IVocab } from 'interfaces'
import { useRouter } from 'next/router'
import { MouseEvent } from 'react'
import {ViewCollection} from '@components/CreatorView/ViewCollection'
import InstructorCourse from './Icourses'
import { coursesample, coursesample2 } from '../Samples/Icourseuser';



const IOptions = () => {
    const router = useRouter()
    return (

        <div id={styles.I_container}> 

           


            <a className={styles.box}>
                <h2 className={styles.font}>Your Courses</h2>

                <div className={styles.showCourses}>
                    Show scheduled courses
                    <div></div>
                </div>
                <div className={styles.coursesBox}>
                    <div className={styles.coursesContent}>
                        <InstructorCourse courses={[coursesample]}></InstructorCourse>
                        {/* <p>SPAN 1 - Intro to Spanish A01</p> */}
                        <p>Enrolled: 20/20</p>
                        <p>Fall 2023</p>
                        <div className={styles.courseEdit}>
                            <button id={styles.btn}>View</button>
                            <button id={styles.btn}>Edit</button>
                            <button id={styles.btn}>Export</button>
                        </div>
                            <div className={styles.outer}>
                                <div className={styles.inner}>
                                   <ViewCollection collections={[sample]}></ViewCollection>
                                </div>
                            </div>
                    </div>
  
                    <div className={styles.coursesContent}>
                    <InstructorCourse courses={[coursesample2]}></InstructorCourse>
                        <p>Enrolled: 20/20</p>
                        <p>Fall 2023</p>

                        <div className={styles.courseEdit}>
                            <button id={styles.btn}>View</button>
                            <button id={styles.btn}>Edit</button>
                            <button id={styles.btn}>Export</button>
                        </div>
                        <div className={styles.outer}>
                            <div className={styles.inner}>
                               <ViewCollection collections={[sample2]}></ViewCollection> 
                            </div>
                        </div>
                    </div>

                </div>
           
           
           
           
           
            </a>
            <div className={styles.box1}>
                <h2 className={styles.fonts}>Tools</h2>

                <br></br>
                <div id={styles.box2} >
                    <div>
                        <h1 className= {styles.font2}>Classes</h1>
                    </div>
    

                    <div id={styles.box4}>
                        <Menu />
                    </div>
                </div>
                <div id={styles.box3}>
                    <h3 className={styles.font2}>Canvas</h3>
                    <Canvas />
                </div>
               

            </div>
            


        </div>


    )
}

export default IOptions
