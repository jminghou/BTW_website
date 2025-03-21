'use client'
import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface CardProps {
  children: ReactNode;
  href?: string;
}

const Card: React.FC<CardProps> = ({ children, href }) => {
  const content = (
    <div className="card">
      {children}
    </div>
  );

  return (
    <StyledWrapper>
      {href ? (
        <a href={href} style={{ textDecoration: 'none' }}>
          {content}
        </a>
      ) : (
        content
      )}
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
    --bg: #f7f7f8;
    --hover-bg: #FFE5F4;
    --hover-text: #E50087;
    width: 32ch;
    text-align: center;
    background: var(--bg);
    padding: 1.5em;
    padding-block: 1.8em;
    border-radius: 15px;
    position: relative;
    overflow: hidden;
    transition: .3s cubic-bezier(.6,.4,0,1),transform .15s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1em;
  }

  .card__body {
    color: #464853;
    line-height: 1.5em;
    font-size: 1em;
  }

  .card > :not(span) {
    transition: .3s cubic-bezier(.6,.4,0,1);
  }

  .card > strong {
    display: block;
    font-size: 1.4rem;
    letter-spacing: -.035em;
  }

  .card span {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--hover-text);
    border-radius: 5px;
    font-weight: bold;
    top: 100%;
    transition: all .3s cubic-bezier(.6,.4,0,1);
  }

  .card:hover span {
    top: 0;
    font-size: 1.2em;
  }

  .card:hover {
    background: var(--hover-bg);
  }

  .card:hover>div,.card:hover>strong {
    opacity: 0;
  }`;

export default Card;
