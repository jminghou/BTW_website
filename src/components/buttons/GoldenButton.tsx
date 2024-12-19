'use client'
import React from 'react';
import styled from 'styled-components';

interface GoldenButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GoldenButton = ({ children, className = '', onClick }: GoldenButtonProps) => {
  return (
    <StyledWrapper className={className}>
      <button className="Btn" onClick={onClick}>
        <span className="button-content">{children}</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .Btn {
    width: 140px;
    height: 40px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(to right,#03b4c7,#bdf9ff,#03b4c7,#03b4c7,#bdf9ff,#03b4c7);
    background-size: 250%;
    background-position: left;
    color: #ffffff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition-duration: 1s;
    overflow: hidden;
  }

  .Btn::before {
    position: absolute;
    content: "";
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 97%;
    height: 90%;
    border-radius: 10px;
    transition-duration: 1s;
    background-color: rgba(0, 0, 0, 0.842);
    background-size: 200%;
  }

  .button-content {
    position: relative;
    z-index: 1;
    color: #ffffff;
  }

  .Btn:hover {
    background-position: right;
    transition-duration: 1s;
  }

  .Btn:hover::before {
    background-position: right;
    transition-duration: 1s;
  }

  .Btn:active {
    transform: scale(0.95);
  }
`;

export default GoldenButton;
