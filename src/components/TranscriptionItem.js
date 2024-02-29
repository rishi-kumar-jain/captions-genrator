


 ///function isilie chalaye kyuki react js me anadr se update nhi hoga
 // start end aur content
export default function TranscriptionItem({ 
  item,
  handleStartTimeChange,
  handleEndTimeChange,
  handleContentChange,

}) {
  if(!item)return '';

  return (
    <div className="my-1 grid grid-cols-3 gap-1 items-center">
      <input type="text"
      className="bg-white/20 w-24 p-1 rounded-md"
       value={item.start_time} 
       onChange={handleStartTimeChange}
      />  
       <input type="text"
      className="bg-white/20 w-24 p-1 rounded-md"
       value={item.end_time} 
       onChange={handleEndTimeChange}
      />  
      
       <input type="text"
      className="bg-white/20 w-24 p-1 rounded-md"
       value={item.content} 
       onChange={handleContentChange}
      />  
      
    
    </div>
  );
}
