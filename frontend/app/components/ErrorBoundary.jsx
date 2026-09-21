'use client';

import { Component } from 'react';

/**
 * 화면 일부에서 예외가 나도 Next 의 "Application error" 전체 화면 대신 안내를 보여줌
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F5F1ED' }}>
            <div className="bg-white/80 border border-[#E6E0DA] rounded-[18px] p-6 text-center max-w-[430px] w-full">
              <div className="text-4xl mb-3">😵</div>
              <p className="text-sm font-semibold text-[#2A2725] mb-1">화면을 표시하는 중 문제가 생겼어요</p>
              <p className="text-xs text-[#6B6662] mb-4">잠시 후 다시 시도하거나 홈으로 이동해 주세요.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-[12px] border border-[#E6E0DA] bg-white text-sm">다시 시도</button>
                <button type="button" onClick={() => { window.location.href = '/'; }} className="flex-1 py-2.5 rounded-[12px] bg-[#2A2725] text-white text-sm">홈으로</button>
              </div>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
