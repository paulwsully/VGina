import React from "react";
import Input from "../Utilities/Input";

function NewTriggerTags({ tags, handleTagInputChange }) {
  const tagString = tags.join(", ");
  return (
    <section>
      <Input id="tags" placeholder="" label="Comma Separated Tags" value={tagString} onTextChange={handleTagInputChange} />
      <div className="tags">
        {tags.map((tag, index) => (
          <span key={index} className="tag pill">
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

export default NewTriggerTags;
