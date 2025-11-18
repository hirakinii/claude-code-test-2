/**
 * Button コンポーネントのユニットテスト
 *
 * 参照: docs/frontend-test-specification.md セクション3.1.1
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('ボタンがテキストと共にレンダリングされる', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  test('onClickハンドラーがクリック時に呼ばれる', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('loadingプロパティがtrueの場合、ボタンが無効化される', () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('処理中...');
  });

  test('disabledプロパティがtrueの場合、ボタンが無効化される', () => {
    render(<Button disabled>Submit</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('loading中でもdisabledでもない場合、ボタンがクリック可能', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  test('variantプロパティが正しく適用される', () => {
    const { rerender } = render(<Button variant="contained">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-contained');

    rerender(<Button variant="outlined">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-outlined');

    rerender(<Button variant="text">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-text');
  });

  test('colorプロパティが正しく適用される', () => {
    render(<Button color="primary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('MuiButton-colorPrimary');
  });

  test('loading中はonClickが呼ばれない', () => {
    const handleClick = jest.fn();
    render(<Button loading onClick={handleClick}>Submit</Button>);

    fireEvent.click(screen.getByRole('button'));

    // loadingの場合はdisabledになるので、クリックイベントが発火しない
    expect(handleClick).not.toHaveBeenCalled();
  });
});
