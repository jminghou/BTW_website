'use client'

import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="card" />
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .card {
   width: 640px;
   height: 254px;
   border-radius: 50px;
   background: #e0e0e0;
   box-shadow: 20px 20px 60px #bebebe,
                 -20px -20px 60px #ffffff;
  }`;

export default Card;
