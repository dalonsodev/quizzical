import { useState } from "react"
import { decode } from "html-entities"
import { clsx } from "clsx"


export default function QuizzicalApp() {
   // State values
   const [isQuizOn, setIsQuizOn] = useState(false)
   const [isQuizSent, setIsQuizSent] = useState(false)
   const [currentQuiz, setCurrentQuiz] = useState([])
   const [userAnswers, setUserAnswers] = useState([])
   const [isLoading, setIsLoading] = useState(false)
   
   // # of questions in quiz
   const quizLength = 10
   
   function handleQuestions(data) {
      const quizWithShuffledAnswers = data.map(q => ({
         question: decode(q.question),
         shuffledAnswers: 
            shuffleAnswers([decode(q.correct_answer), 
            ...q.incorrect_answers.map(decode)]),
         correctAnswer: decode(q.correct_answer)
      }))
      setCurrentQuiz(quizWithShuffledAnswers)
   }
   
   function shuffleAnswers(arr) {
      const newArr = [...arr]
      for (let i = newArr.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [newArr[i], newArr[j]] = [newArr[j], newArr[i]]
      }
      return newArr
   }
   
   function getAnswerClasses(isQuizSent, answer, correctAnswer, selectedAnswer) {
      return clsx("answer-button", {
         correct: isQuizSent && answer === correctAnswer,
         incorrect: isQuizSent && answer === selectedAnswer && answer !== correctAnswer
      })
   }
   
   const questionElements = currentQuiz.map((q, index) => {
      // const selectedAnswer = userAnswers[index] ? userAnswers[index].selectedAnswer : null
      const selectedAnswer = userAnswers[index]?.selectedAnswer || null // ChatGPT suggestion
      
      return (
         <li className="question" key={q.question}>
            <h2>{q.question}</h2>
            <ul className="answers">
               {q.shuffledAnswers.map(answer => (
                  <li className="answer" key={answer}>
                     <input 
                        id={answer}
                        value={answer}
                        type="radio"
                        name={`question_${index}`}
                        disabled={isQuizSent}
                     />
                     <label 
                        htmlFor={answer} 
                        className={getAnswerClasses(isQuizSent, answer, q.correctAnswer, selectedAnswer)}
                     >{answer}</label>
                  </li>
               ))}
            </ul>
         </li>
      )
   })
      
   function getUserAnswers(e) {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      const answers = currentQuiz.map((q, index) => ({
         question: q.question,
         selectedAnswer: formData.get(`question_${index}`),
         correctAnswer: q.correctAnswer
      }))
      setUserAnswers(answers)
      setIsQuizSent(true)
   }
   
   function playAgain() {
      setIsQuizOn(false)
      setIsQuizSent(false)
      setUserAnswers([])
      setCurrentQuiz([])
      startQuiz()
   }
   
   function startQuiz() {
      setIsLoading(true)
      setIsQuizOn(true)
      fetch(`https://opentdb.com/api.php?amount=${quizLength}&category=9&difficulty=easy&type=multiple`)
         .then(res => {
            if (!res.ok) throw new Error("Failed to fetch quiz data")
            return res.json()
         })
         .then(data => {
            handleQuestions(data.results)
            setIsLoading(false)
         })
         .catch(err => {
            console.error("Error fetching quiz:", err)
            setCurrentQuiz([])
            setIsQuizOn(false)
            setIsLoading(false)
         })
   }
   
   const correctAnswersCount = userAnswers
      .filter(answer => answer.selectedAnswer === answer.correctAnswer).length
   
   function getContent() {
      if (!isQuizOn && !isQuizSent) {
         return (
            <section className={clsx("intro", { "fade-out": isLoading })}>
               <h1 className="title">Quizzical</h1>
               <span className="subtitle">Wanna check your general knowledge?</span>
               <button onClick={startQuiz} className="start">Start quiz</button>
            </section>
         );
      }
      if (isQuizOn && isLoading) {
         return <div className="loading">Loading questions...</div>;
      }
      if (isQuizOn) {
         return (
            <>
               <form onSubmit={getUserAnswers}>
                  <ul>{questionElements}</ul>
                  {!isQuizSent && <button className="check">Check answers</button>}
               </form>
               {isQuizSent && (
                  <div className="results">
                     <h3>You scored {correctAnswersCount}/{quizLength} correct answers</h3>
                     <button onClick={playAgain} className="play-again">Play again</button>
                  </div>
               )}
            </>
         );
      }
      return null;
   }
   
   return (
      <main>
         <div className="top-blob-container"></div>
         <section className={clsx("questions", { "fade-in": !isLoading })}>
            {getContent()}
         </section>
         <div className="bottom-blob-container"></div>
      </main>
   )
}