from __future__ import print_function

import argparse
import os
import sys
import tempfile

try:
    import opentimelineio as otio
except ImportError:
    raise SystemExit('It appears OpenTimelineIO is not installed on the selected Python interpreter. As such, '
        'I cannot really run anything, so fix it.')


class OTIOTools(object):
    def __init__(self):
        self.arg_parser = argparse.ArgumentParser()
        self.arg_parser.add_argument(
            '-v', '--verbosity',
            type=int,
            default=3,
            help='Verbosity level between 1 and 4. 1 = errors and warning, 4 = everything')

        self.subparsers = self.arg_parser.add_subparsers()
        self.set_up_subparser_export_file()
        self.set_up_subparser_convert_file()
    
    def parse(self, args):
        if not len(args):
            args = ['-h']
        
        parsed = self.arg_parser.parse_args(args)
                
        return parsed.func(vars(parsed))

    def set_up_subparser_export_file(self):
        parser = self.subparsers.add_parser(
            'export-file',
            help='Export the given file to the given location.')

        parser.add_argument(
            '-i', '--input',
            help='Path to input file.')
        
        parser.add_argument(
            '-o', '--output',
            help='Path to place the output OTIO file.')

        parser.set_defaults(func=self.export_file)

    def set_up_subparser_convert_file(self):
        adapters = otio.adapters.available_adapter_names()

        parser = self.subparsers.add_parser(
            'convert-file',
            help='Convert a file to another file.')

        parser.add_argument(
            '-f', '--format',
            choices=adapters,
            help='The file type to convert to.')

        parser.add_argument(
            '-i', '--input',
            help='Path to the input file.')

        parser.add_argument(
            '-t', '--temp-file',
            required=False,
            help='Path to temporary file.')

        parser.set_defaults(func=self.convert_file)


    def export_file(self, kwargs):
        input_path = kwargs.get('input')
        output_path = kwargs.get('output')

        timeline = otio.adapters.read_from_file(input_path)
        otio.adapters.write_to_file(timeline, output_path)

        print(input_path)
        return input_path

    def convert_file(self, kwargs):
        file_format = kwargs.get('format')
        input_path = kwargs.get('input')
        temp_file = kwargs.get('temp_file')

        # if not temp_file:
        #     temp_file = tempfile.TemporaryFile(prefix='OTIO_')

        timeline = otio.adapters.read_from_file(input_path)
        otio.adapters.write_to_file(timeline, temp_file, adapter_name=file_format)

        print(temp_file)
        return temp_file


def main(args, exit=False):
    tools = OTIOTools()
    exitCode = tools.parse(args[1:])
    if exit:
        sys.exit(exitCode)
    return exitCode

if __name__ == '__main__':
    main(sys.argv)
