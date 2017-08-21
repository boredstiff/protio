from __future__ import print_function

import argparse
import os
import sys

try:
    import opentimelineio
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
    
    def parse(self, args):
        if not len(args):
            args = ['-h']
        
        parsed = self.arg_parser.parse_args(args)
                
        return parsed.func(vars(parsed))

    def set_up_subparser_export_file(self):
        parser = self.subparsers.add_parser(
            'export-file',
            help='Export the given file to the given location')

        parser.add_argument(
            '-i', '--input',
            help='Path to input file')
        
        parser.add_argument(
            '-o', '--output',
            help='Path to place the output OTIO file.')

        parser.set_defaults(func=self.export_file)
    
    def export_file(self, **kwargs):
        input_path = kwargs.get('input')
        output_path = kwargs.get('output')

        print input_path
        return input_path


def main(args, exit=False):
    OTIOTools = OTIOTools()
    exitCode = OTIOTools.parse(args[1:])
    if exit:
        sys.exit(exitCode)
    return exitCode

if __name__ == '__main__':
    main(sys.argv)
