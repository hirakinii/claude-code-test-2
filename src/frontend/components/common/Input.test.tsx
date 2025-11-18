/**
 * Input コンポーネントのユニットテスト
 *
 * 参照: docs/frontend-test-specification.md セクション3.1.2
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  test('ラベル付きで入力フィールドがレンダリングされる', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('入力値が変更されるとonChangeが呼ばれる', () => {
    const handleChange = jest.fn();
    render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(handleChange).toHaveBeenCalled();
  });

  test('errorプロパティがtrueの場合、エラーメッセージが表示される', () => {
    render(<Input error helperText="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  test('requiredプロパティがtrueの場合、required属性が付与される', () => {
    render(<Input required />);
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  test('placeholderが正しく表示される', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  test('disabledプロパティがtrueの場合、入力フィールドが無効化される', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  test('helperTextが正しく表示される', () => {
    render(<Input helperText="Enter a valid email address" />);
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });

  test('fullWidthプロパティがデフォルトで適用される', () => {
    render(<Input label="Email" />);
    const inputContainer = screen.getByLabelText('Email').closest('.MuiTextField-root');
    expect(inputContainer).toHaveClass('MuiTextField-fullWidth');
  });

  test('typeプロパティが正しく適用される', () => {
    render(<Input type="password" />);
    expect(screen.getByRole('textbox', { hidden: true })).toHaveAttribute('type', 'password');
  });

  test('variantプロパティが正しく適用される', () => {
    const { rerender } = render(<Input variant="outlined" label="Email" />);
    expect(screen.getByLabelText('Email').closest('.MuiTextField-root')).toHaveClass('MuiOutlinedInput-root');

    rerender(<Input variant="filled" label="Email" />);
    expect(screen.getByLabelText('Email').closest('.MuiTextField-root')).toHaveClass('MuiFilledInput-root');
  });
});
