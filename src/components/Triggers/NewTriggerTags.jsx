import React, { useState, useEffect } from "react";

function NewTriggerTags({ tags: defaultTags, handleTagInputChange }) {
  const [tags, setTags] = useState(defaultTags || []);
  const [inputValue, setInputValue] = useState(tags.join(","));

  useEffect(() => {
    setInputValue((defaultTags || []).join(","));
  }, [defaultTags]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value); // Update the input with the new value

    const newTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== ""); // Convert input string back into an array of tags
    setTags(newTags); // Update the tags state

    // Call the parent component's function to update its state.
    handleTagInputChange(value);
  };

  return (
    <section>
      <label className="input">
        <input type="text" value={inputValue} placeholder="Add tags" onChange={handleChange} />
        <span>Tags</span>
      </label>
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
