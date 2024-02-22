import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesLeft, faAngleLeft, faAnglesRight, faAngleRight } from "@fortawesome/free-solid-svg-icons";

const Pagination = ({ total, perPage, currentPage, setCurrentPage }) => {
  const pageCount = Math.ceil(total / perPage);

  const firstPage = () => setCurrentPage(0);
  const lastPage = () => setCurrentPage(pageCount - 1);
  const nextPage = () => setCurrentPage((current) => Math.min(current + 1, pageCount - 1));
  const prevPage = () => setCurrentPage((current) => Math.max(current - 1, 0));

  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(currentPage - 2, 0);
    const endPage = Math.min(startPage + 4, pageCount - 1);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination">
      <button onClick={firstPage} disabled={currentPage === 0}>
        <FontAwesomeIcon icon={faAnglesLeft} />
      </button>
      <button onClick={prevPage} disabled={currentPage === 0}>
        <FontAwesomeIcon icon={faAngleLeft} />
      </button>
      {getPageNumbers().map((number) => (
        <button className="num-btn" key={number} onClick={() => setCurrentPage(number)} disabled={number === currentPage}>
          {number + 1}
        </button>
      ))}
      <button onClick={nextPage} disabled={currentPage >= pageCount - 1}>
        <FontAwesomeIcon icon={faAngleRight} />
      </button>
      <button onClick={lastPage} disabled={currentPage >= pageCount - 1}>
        <FontAwesomeIcon icon={faAnglesRight} />
      </button>
    </div>
  );
};

export default Pagination;
