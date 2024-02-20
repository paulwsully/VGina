import React from "react";
import Input from "../Utilities/Input";

const NewTriggerTags = ({ tags, handleTagInputChange }) => (
  <section>
    <Input id="tags" placeholder="" label="Comma Separated Tags" onTextChange={handleTagInputChange} />
    <div className="tags">
      {tags.map((tag, index) => (
        <span key={index} className="tag pill">
          {tag}
        </span>
      ))}
    </div>
  </section>
);

export default NewTriggerTags;
