import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useStudyStore } from '../store/useStudyStore';

export const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const theme = useStudyStore((state) => state.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      // Show button only when scrolled down past 160px from top
      if (scrollY > 160) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <StyledWrapper $visible={isVisible} $isDark={isDark}>
      <button 
        type="button"
        className="button" 
        onClick={scrollToTop}
        title="Back to top"
        aria-label="Back to top"
      >
        <svg className="svgIcon" viewBox="0 0 384 512" aria-hidden="true">
          <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z" />
        </svg>
      </button>
    </StyledWrapper>
  );
};

export default BackToTopButton;

interface StyledWrapperProps {
  $visible: boolean;
  $isDark: boolean;
}

const StyledWrapper = styled.div<StyledWrapperProps>`
  position: fixed;
  right: clamp(16px, 3vw, 28px);
  bottom: clamp(18px, 3vw, 28px);
  z-index: 90;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $visible }) => ($visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)')};
  pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  .button {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    /* Theme background for dark mode vs light mode */
    background-color: ${({ $isDark }) => ($isDark ? 'rgb(20, 20, 19)' : '#ffffff')};
    border: 1px solid ${({ $isDark }) => ($isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(233, 118, 43, 0.22)')};
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Theme ring matching focus orange #e9762b */
    box-shadow: ${({ $isDark }) =>
      $isDark
        ? '0px 0px 0px 4px rgba(233, 118, 43, 0.25), 0 8px 24px rgba(0, 0, 0, 0.65)'
        : '0px 0px 0px 4px rgba(233, 118, 43, 0.2), 0 8px 22px rgba(180, 80, 20, 0.16)'};
    cursor: pointer;
    transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
    overflow: hidden;
    position: relative;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* Support html.light and html.dark class overrides for instant sync */
  html.light & .button {
    background-color: #ffffff;
    border-color: rgba(233, 118, 43, 0.22);
    box-shadow: 0px 0px 0px 4px rgba(233, 118, 43, 0.2), 0 8px 22px rgba(180, 80, 20, 0.16);
  }

  html.dark & .button {
    background-color: rgb(20, 20, 19);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0px 0px 0px 4px rgba(233, 118, 43, 0.25), 0 8px 24px rgba(0, 0, 0, 0.65);
  }

  .svgIcon {
    width: 13px;
    height: 17px;
    transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.25s ease;
  }

  .svgIcon path {
    fill: ${({ $isDark }) => ($isDark ? '#ffffff' : '#e9762b')};
    transition: fill 0.3s ease;
  }

  html.light & .svgIcon path {
    fill: #e9762b !important;
  }

  html.dark & .svgIcon path {
    fill: #ffffff !important;
  }

  /* Hover state: expands smoothly to 140px pill in brand focus orange */
  .button:hover {
    width: 140px;
    border-radius: 50px;
    background-color: #e9762b;
    border-color: #e9762b;
    box-shadow: 0px 0px 0px 4px rgba(233, 118, 43, 0.42), 0 10px 30px rgba(233, 118, 43, 0.45);
    align-items: center;
  }

  html.light & .button:hover,
  html.dark & .button:hover {
    background-color: #e9762b !important;
    border-color: #e9762b !important;
    box-shadow: 0px 0px 0px 4px rgba(233, 118, 43, 0.42), 0 10px 30px rgba(233, 118, 43, 0.45) !important;
  }

  .button:hover .svgIcon {
    transform: translateY(-200%);
    opacity: 0;
  }

  .button::before {
    position: absolute;
    top: 130%;
    left: 50%;
    transform: translate(-50%, 0);
    content: "Back to Top";
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    opacity: 0;
    transition: top 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease, font-size 0.35s ease;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  }

  .button:hover::before {
    font-size: 12.5px;
    opacity: 1;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .button:active {
    transform: scale(0.95);
  }
`;
