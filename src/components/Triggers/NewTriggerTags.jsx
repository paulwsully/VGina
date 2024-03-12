import React, { useState, useEffect } from "react";

function NewTriggerTags({ tags: defaultTags, handleTagInputChange }) {
  const [tags, setTags] = useState(defaultTags || []);
  const [inputValue, setInputValue] = useState(tags.join(","));

  useEffect(() => {
    setInputValue((defaultTags || []).join(","));
  }, [defaultTags]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const newTags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");
    setTags(newTags);

    handleTagInputChange(value);
  };

  return (
    <section>
      <label className="input">
        <input type="text" value={inputValue} placeholder="" onChange={handleChange} />
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
