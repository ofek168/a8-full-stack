import React, { useState, FC, InputHTMLAttributes } from 'react';
import styles from './createcourse.module.scss'
import Link from 'next/link'
import { sample, sample2, coursesample } from '@components/Samples'
import { ICollection } from 'interfaces'
import CollectionsList from '@components/CreatorView/CollectionsView/CollectionsList';
import router, { useRouter } from 'next/router'
import {ViewCollectionWithDelete,AddCollections} from '@components/CreatorView/ViewCollection';
import InstructorCourse from '@components/InstructorView/Icourses';
import Axios from 'axios';
import ClickAwayListener from 'react-click-away-listener';

const PORT = '4000';
const HOST = 'localhost'; // 'DOCKER_NODE_SERVICE'; // 'localhost'
const PUT_END_POINT = 'submitCourse'; //this code requires two endpoints, one for a get request and one for a push
const GET_END_POINT = 'getCollections';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
}

const Main: FC<InputProps> = ({ name, label, ...rest }) => {
    const [buttonPopup, setButtonPopup] = useState(false);
    const [currentCollections,setCurrentCollections] = useState<ICollection[]>([]);
    const [serverCollections,setServerCollections] = useState<ICollection[]>([]);
    const [selectedCollections,setSelectedCollections] = useState<ICollection[]>([]);
    return (
        <main className = {styles.container}>
            <h1 className = {styles.title} >Create New Course</h1>
            <div className = {styles.courseBoxWrapper}>
                <div className = {styles.courseInfoBox}>
                    <div id = {styles.inputs}>
                        <label htmlFor={name}> Course Name:{label}</label>
                        <input id={name} {...rest} className={styles.input} placeholder="Type Something..." ></input>
                    </div>
                    <div id = {styles.inputs}>
                        <h2>Year</h2>
                        <select>
                            <option>2022</option>
                            <option>2023</option>
                            <option>2024</option>
                        </select>  
                    </div>
                    <div id = {styles.inputs}>
                        <h2>Quarter/Semester</h2>
                        <select>
                            <option>Fall</option>
                            <option>Winter</option>
                            <option>Spring</option>
                        </select>
                    </div>
                </div>
                <div className = {styles.courseTimeBox}>
                    <div id = {styles.inputs}>
                        <label htmlFor={name}> Maximum Enrolled:{label}</label>
                        <input id={name} {...rest} className={styles.input} placeholder="Type Something..." ></input>
                    </div>
                    <div id = {styles.inputs}>
                        <label htmlFor={name}> Class Time:{label}</label>
                        <input id={name} {...rest} className={styles.input} placeholder="Type Something..." ></input>
                    </div>
                    <div id = {styles.inputs}>
                        <h2>Location</h2>
                        <select>
                            <option>In Person</option>
                            <option>Zoom</option>
                        </select>
                    </div>
                    <div id = {styles.inputs}>
                        <label htmlFor={name}> Location/Zoom Link:{label}</label>
                        <input id={name} {...rest} className={styles.input} placeholder="Type Something..." ></input>
                    </div>
                </div>
            </div>
            <h1 className = {styles.title}>My Collection</h1>
            <div>
                <ViewCollectionWithDelete collections={currentCollections} updateState={setCurrentCollections}></ViewCollectionWithDelete>

                <button type="button" className={styles.button} onClick={() => {
                    Axios.get(`http://${HOST}:${PORT}/${GET_END_POINT}`).then( function (response){
                        console.log(response.data);
                        setServerCollections(response.data);
                        setSelectedCollections([]);
                        setButtonPopup(true);
                    });
                }
                }>
                    Select New Collection
                </button>

                {buttonPopup && (
                    <ClickAwayListener onClickAway={() => setButtonPopup(false)}>
                        <div className={styles.modal}>
                            <div className={styles.modal_content}>
                            { 
                                <AddCollections serverCollections={serverCollections} serverUpdateState={setServerCollections} 
                                selectStates={selectedCollections} selectUpdateStates= {setSelectedCollections}/>
                                
                            }
                            <button type="button" className={styles.button} onClick={() => {
                            //change collection state here
                            setCurrentCollections(selectedCollections);
                            setSelectedCollections([]);
                            setButtonPopup(false);
                                }
                                }>
                                    Submit
                            </button>

                            <button type="button" className={styles.button} onClick={() => {
                                setSelectedCollections([]);
                                setButtonPopup(false);
                                }
                                }>
                                    Cancel
                            </button>
                            </div>
                        </div>
                        
                    </ClickAwayListener>
                    
                )}

                <button type="button" className={styles.button} onClick={() => {
                    router.push('/instructor_view')
                }
                }>
                    Back
                </button>
                <button type="button" className={styles.button} onClick={() => {
                    Axios.put(`http://${HOST}:${PORT}/${PUT_END_POINT}`,currentCollections);
                }
                }>
                    PutRequest
                </button>
            </div>
            <div className = {styles.instructorCourse}>
                <InstructorCourse courses={[coursesample]}></InstructorCourse>
            </div>
        </main>


    )
}

export default Main
